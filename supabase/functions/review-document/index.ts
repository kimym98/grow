// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"
import { extractText, getDocumentProxy } from "unpdf"

import { AuthRequiredError, jsonError, requireUserId } from "../_shared/auth.ts"
import { generateDocumentReview, type LlmProviderName } from "./llm.ts"

interface ReviewRequestBody {
  documentReviewId: string
  provider: LlmProviderName
}

interface DocumentReviewVersion {
  version: number
  createdAt: string
  summary: string
}

const SUPPORTED_PROVIDERS: LlmProviderName[] = ["gemini", "anthropic"]

export default {
  fetch: withSupabase({ auth: ["user"] }, async (req, ctx) => {
    let userId: string
    try {
      userId = requireUserId(ctx.userClaims)
    } catch (error) {
      if (error instanceof AuthRequiredError) return jsonError("UNAUTHENTICATED", error.message, 401)
      throw error
    }

    let body: ReviewRequestBody
    try {
      body = await req.json()
    } catch {
      return jsonError("INVALID_BODY", "요청 본문이 올바르지 않습니다", 400)
    }

    if (!body.documentReviewId) {
      return jsonError("INVALID_BODY", "documentReviewId가 필요합니다", 400)
    }
    if (!SUPPORTED_PROVIDERS.includes(body.provider)) {
      return jsonError("INVALID_PROVIDER", `provider는 ${SUPPORTED_PROVIDERS.join("/")} 중 하나여야 합니다`, 400)
    }

    // 소유권 확인: ctx.supabase는 RLS가 적용된 클라이언트라 본인 레코드만 조회된다
    // (타 사용자의 documentReviewId를 넘겨도 조회 결과가 비어 NOT_FOUND로 처리됨)
    const { data: review, error: reviewError } = await ctx.supabase
      .from("document_reviews")
      .select("*")
      .eq("id", body.documentReviewId)
      .single()

    if (reviewError || !review) {
      return jsonError("NOT_FOUND", "문서를 찾을 수 없습니다", 404)
    }

    if (review.status === "processing") {
      return jsonError("ALREADY_PROCESSING", "이미 첨삭이 진행 중입니다", 409)
    }

    // API 키가 없으면 status를 건드리지 않고 즉시 반환한다 (클라이언트가 설정 화면으로 유도)
    const { data: apiKey, error: keyError } = await ctx.supabase.rpc("get_user_llm_key", {
      p_provider: body.provider,
    })

    if (keyError) {
      return jsonError("KEY_LOOKUP_FAILED", keyError.message, 500)
    }
    if (!apiKey) {
      return jsonError(
        "API_KEY_NOT_FOUND",
        `등록된 ${body.provider} API 키가 없습니다. 설정에서 키를 등록해주세요.`,
        400
      )
    }

    await ctx.supabase.from("document_reviews").update({ status: "processing" }).eq("id", body.documentReviewId)

    const existingVersions = (review.versions ?? []) as DocumentReviewVersion[]

    try {
      const objectPath = `${userId}/${body.documentReviewId}.pdf`
      const { data: pdfBlob, error: downloadError } = await ctx.supabase.storage
        .from("documents")
        .download(objectPath)

      if (downloadError || !pdfBlob) {
        throw new Error(downloadError?.message ?? "PDF 다운로드에 실패했습니다")
      }

      const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer())
      const pdfDocument = await getDocumentProxy(pdfBytes)
      const { text: originalText } = await extractText(pdfDocument, { mergePages: true })

      if (!originalText.trim()) {
        throw new Error("PDF에서 텍스트를 추출하지 못했습니다")
      }

      const result = await generateDocumentReview(body.provider, apiKey, {
        text: originalText,
        documentType: review.type,
        resumeQuestion: review.resume_question ?? undefined,
      })

      const comments = result.comments.map((comment) => ({
        id: crypto.randomUUID(),
        quote: comment.quote,
        comment: comment.comment,
      }))

      const versions: DocumentReviewVersion[] = [
        ...existingVersions,
        { version: review.version, createdAt: new Date().toISOString(), summary: "AI 첨삭 완료" },
      ]

      const { error: updateError } = await ctx.supabase
        .from("document_reviews")
        .update({
          status: "completed",
          original_text: originalText,
          reviewed_text: result.reviewedText,
          comments,
          versions,
        })
        .eq("id", body.documentReviewId)

      if (updateError) throw new Error(updateError.message)

      return Response.json({ status: "completed" })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      const versions: DocumentReviewVersion[] = [
        ...existingVersions,
        { version: review.version, createdAt: new Date().toISOString(), summary: `첨삭 실패: ${message}` },
      ]

      await ctx.supabase.from("document_reviews").update({ status: "failed", versions }).eq("id", body.documentReviewId)

      return jsonError("REVIEW_FAILED", message, 500)
    }
  }),
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. 로그인한 사용자의 access token으로 호출(auth: ["user"] 모드):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/review-document' \
    --header 'Authorization: Bearer <user access token>' \
    --header 'Content-Type: application/json' \
    --data '{"documentReviewId": "<uuid>", "provider": "gemini"}'

*/
