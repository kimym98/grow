// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { AuthRequiredError, jsonError, requireUserId } from "../_shared/auth.ts"
import { getCachedLlmResponse, setCachedLlmResponse, hashPromptTemplate, sha256Hex } from "../_shared/llm-cache.ts"
import { logEdgeFunctionError } from "../_shared/error-log.ts"
import {
  FEEDBACK_PROMPT_TEMPLATE,
  generateCoverLetterFeedback,
  type CoverLetterFeedbackResult,
  type LlmProviderName,
} from "./llm.ts"

interface FeedbackRequestBody {
  questionId: string
  provider: LlmProviderName
}

const SUPPORTED_PROVIDERS: LlmProviderName[] = ["gemini", "anthropic"]
const FUNCTION_NAME = "feedback-cover-letter-question"

export default {
  fetch: withSupabase({ auth: ["user"] }, async (req, ctx) => {
    let userId: string
    try {
      userId = requireUserId(ctx.userClaims)
    } catch (error) {
      if (error instanceof AuthRequiredError) return jsonError("UNAUTHENTICATED", error.message, 401)
      throw error
    }

    let body: FeedbackRequestBody
    try {
      body = await req.json()
    } catch {
      return jsonError("INVALID_BODY", "요청 본문이 올바르지 않습니다", 400)
    }

    if (!body.questionId) {
      return jsonError("INVALID_BODY", "questionId가 필요합니다", 400)
    }
    if (!SUPPORTED_PROVIDERS.includes(body.provider)) {
      return jsonError("INVALID_PROVIDER", `provider는 ${SUPPORTED_PROVIDERS.join("/")} 중 하나여야 합니다`, 400)
    }

    // 소유권 확인: ctx.supabase는 RLS가 적용된 클라이언트라 본인 레코드만 조회된다
    // (타 사용자의 questionId를 넘겨도 조회 결과가 비어 NOT_FOUND로 처리됨)
    const { data: question, error: questionError } = await ctx.supabase
      .from("cover_letter_questions")
      .select("*")
      .eq("id", body.questionId)
      .single()

    if (questionError || !question) {
      return jsonError("NOT_FOUND", "자소서 문항을 찾을 수 없습니다", 404)
    }

    if (question.feedback_status === "processing") {
      return jsonError("ALREADY_PROCESSING", "이미 첨삭이 진행 중입니다", 409)
    }

    // "일반 첨삭"이 아니라 "그 기업에 맞춘" 첨삭이 이 기능의 핵심 목적이므로,
    // 기업 분석이 완료되어 있지 않으면 폴백하지 않고 하드 실패시킨다.
    const { data: analysis } = await ctx.supabase
      .from("company_analyses")
      .select("*")
      .eq("application_id", question.application_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!analysis || analysis.status !== "completed") {
      return jsonError(
        "ANALYSIS_NOT_READY",
        "지원 기업 분석이 완료되어야 첨삭을 받을 수 있습니다. 먼저 기업 분석을 완료해주세요.",
        400
      )
    }

    const answerText: string = question.answer_text ?? ""
    if (!answerText.trim()) {
      return jsonError("EMPTY_ANSWER", "답변을 먼저 작성해야 첨삭을 받을 수 있습니다", 400)
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

    await ctx.supabase
      .from("cover_letter_questions")
      .update({ feedback_status: "processing", feedback_error_message: null })
      .eq("id", body.questionId)

    try {
      const questionText: string = question.question_text
      const charLimit: number | null = question.char_limit
      const analysisSummary: string = analysis.summary ?? ""
      const analysisCultureFit: string = analysis.culture_fit ?? ""
      const analysisBusinessDomain: string = analysis.business_domain ?? ""
      const analysisTechStack: string = analysis.tech_stack ?? ""

      // 캐시 키: 프롬프트 템플릿 해시 + provider + 문항/답변/글자수 제한 + 기업 분석 컨텍스트.
      // 프롬프트 문구가 바뀌면 해시가 바뀌어 자동으로 캐시가 무효화되고, 답변을 수정하거나
      // 기업 분석이 갱신되면 새 키가 되어 재호출된다
      const promptTemplateHash = await hashPromptTemplate(FEEDBACK_PROMPT_TEMPLATE)
      const cacheKey = await sha256Hex(
        `${promptTemplateHash}|${body.provider}|${questionText}|${answerText}|${charLimit ?? ""}|${analysisSummary}|${analysisCultureFit}|${analysisBusinessDomain}|${analysisTechStack}`
      )

      const cached = await getCachedLlmResponse<CoverLetterFeedbackResult>(ctx.supabase, FUNCTION_NAME, cacheKey)

      const result =
        cached ??
        (await generateCoverLetterFeedback(body.provider, apiKey, {
          questionText,
          answerText,
          charLimit,
          analysisSummary,
          analysisCultureFit,
          analysisBusinessDomain,
          analysisTechStack,
        }))

      if (!cached) {
        await setCachedLlmResponse(ctx.supabase, userId, FUNCTION_NAME, cacheKey, result)
      }

      const { error: updateError } = await ctx.supabase
        .from("cover_letter_questions")
        .update({
          feedback_status: "completed",
          feedback_text: result.feedbackText,
          feedback_generated_at: new Date().toISOString(),
          feedback_error_message: null,
        })
        .eq("id", body.questionId)

      if (updateError) throw new Error(updateError.message)

      return Response.json({ status: "completed" })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      await ctx.supabase
        .from("cover_letter_questions")
        .update({ feedback_status: "failed", feedback_error_message: message })
        .eq("id", body.questionId)

      await logEdgeFunctionError(ctx.supabaseAdmin, "feedback-cover-letter-question", message, {
        questionId: body.questionId,
        provider: body.provider,
      })

      return jsonError("FEEDBACK_FAILED", message, 500)
    }
  }),
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. 로그인한 사용자의 access token으로 호출(auth: ["user"] 모드):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/feedback-cover-letter-question' \
    --header 'Authorization: Bearer <user access token>' \
    --header 'Content-Type: application/json' \
    --data '{"questionId": "<uuid>", "provider": "gemini"}'

*/
