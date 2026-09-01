import {
  coverLetterQuestionToRowPayload,
  rowToCoverLetterQuestion,
  type CoverLetterQuestion,
  type CoverLetterQuestionRow,
} from "@app/shared"

import { supabase } from "@/lib/supabase"
import type { LlmProviderName } from "@/lib/llm-keys"

type CoverLetterQuestionCreateInput = Pick<CoverLetterQuestion, "questionText" | "charLimit">
type CoverLetterQuestionUpdateInput = Partial<
  Pick<CoverLetterQuestion, "questionText" | "charLimit" | "answerText">
>

/** 특정 지원 내역의 자소서 문항·답변 전체를 순서대로 조회한다 (RLS로 소유자 데이터만 반환) */
export async function fetchCoverLetterQuestions(applicationId: string): Promise<CoverLetterQuestion[]> {
  const { data, error } = await supabase
    .from("cover_letter_questions")
    .select("*")
    .eq("application_id", applicationId)
    .order("order_index", { ascending: true })

  if (error) throw new Error(error.message)

  return (data as CoverLetterQuestionRow[]).map(rowToCoverLetterQuestion)
}

/** 새 자소서 문항을 생성한다 (order_index는 현재 문항 개수 다음 순번으로 자동 부여) */
export async function createCoverLetterQuestion(
  applicationId: string,
  input: CoverLetterQuestionCreateInput
): Promise<CoverLetterQuestion> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const { count, error: countError } = await supabase
    .from("cover_letter_questions")
    .select("*", { count: "exact", head: true })
    .eq("application_id", applicationId)

  if (countError) throw new Error(countError.message)

  const payload = {
    ...coverLetterQuestionToRowPayload(input),
    user_id: userData.user.id,
    application_id: applicationId,
    order_index: count ?? 0,
  }

  const { data, error } = await supabase.from("cover_letter_questions").insert(payload).select().single()

  if (error) throw new Error(error.message)

  return rowToCoverLetterQuestion(data as CoverLetterQuestionRow)
}

/** 자소서 문항 또는 답변을 부분 수정한다 */
export async function updateCoverLetterQuestion(
  id: string,
  patch: CoverLetterQuestionUpdateInput
): Promise<CoverLetterQuestion> {
  const payload = coverLetterQuestionToRowPayload(patch)

  const { data, error } = await supabase
    .from("cover_letter_questions")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return rowToCoverLetterQuestion(data as CoverLetterQuestionRow)
}

/** 자소서 문항을 삭제한다 */
export async function deleteCoverLetterQuestion(id: string): Promise<void> {
  const { error } = await supabase.from("cover_letter_questions").delete().eq("id", id)

  if (error) throw new Error(error.message)
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      const body = await context.json().catch(() => null)
      if (body?.message) return body.message as string
    }
  }
  return error instanceof Error ? error.message : "자소서 문항 첨삭 요청에 실패했습니다"
}

/** feedback-cover-letter-question Edge Function을 호출해 기업 맞춤 첨삭을 시작시킨다 (비동기로 진행되며 feedback_status를 폴링해 확인) */
export async function requestCoverLetterQuestionFeedback(
  questionId: string,
  provider: LlmProviderName
): Promise<void> {
  const { error } = await supabase.functions.invoke("feedback-cover-letter-question", {
    body: { questionId, provider },
  })

  if (error) throw new Error(await extractFunctionErrorMessage(error))
}
