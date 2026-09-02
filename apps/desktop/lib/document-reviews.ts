import { rowToDocumentReview, type DocumentReview, type DocumentReviewRow } from "@app/shared"

import { supabase } from "@/lib/supabase"
import type { LlmProviderName } from "@/lib/llm-keys"

/** 문서 첨삭 원본 PDF 다운로드/미리보기용 signed URL을 발급한다 (60초 유효) */
export async function getDocumentReviewSignedUrl(userId: string, documentReviewId: string): Promise<string> {
  const objectPath = `${userId}/${documentReviewId}.pdf`

  const { data, error } = await supabase.storage.from("documents").createSignedUrl(objectPath, 60)

  if (error) throw new Error(error.message)

  return data.signedUrl
}

/** document_reviews 테이블에서 로그인한 사용자의 전체 문서를 최근 수정순으로 조회한다 (RLS로 소유자 데이터만 반환) */
export async function fetchDocumentReviews(): Promise<DocumentReview[]> {
  const { data, error } = await supabase
    .from("document_reviews")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data as DocumentReviewRow[]).map(rowToDocumentReview)
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      const body = await context.json().catch(() => null)
      if (body?.message) return body.message as string
    }
  }
  return error instanceof Error ? error.message : "첨삭 요청에 실패했습니다"
}

/** review-document Edge Function을 호출해 PDF 추출~LLM 첨삭~저장을 시작시킨다 (비동기로 진행되며 status를 폴링해 확인) */
export async function triggerDocumentReview(documentReviewId: string, provider: LlmProviderName): Promise<void> {
  const { error } = await supabase.functions.invoke("review-document", {
    body: { documentReviewId, provider },
  })

  if (error) throw new Error(await extractFunctionErrorMessage(error))
}
