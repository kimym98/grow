import type { CoverLetterQuestion, CoverLetterQuestionRow } from "../types/cover-letter-question"

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 */
export function rowToCoverLetterQuestion(row: CoverLetterQuestionRow): CoverLetterQuestion {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    orderIndex: row.order_index,
    questionText: row.question_text,
    charLimit: row.char_limit,
    answerText: row.answer_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 도메인 타입(camelCase)의 일부 필드를 DB row(snake_case) insert/update payload로 변환한다.
 * id/userId/applicationId/createdAt/updatedAt은 호출측(CRUD 함수)에서 별도로 채우므로 제외한다.
 */
export function coverLetterQuestionToRowPayload(
  input: Partial<
    Pick<CoverLetterQuestion, "orderIndex" | "questionText" | "charLimit" | "answerText">
  >
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if ("orderIndex" in input) payload.order_index = input.orderIndex
  if ("questionText" in input) payload.question_text = input.questionText
  if ("charLimit" in input) payload.char_limit = input.charLimit ?? null
  if ("answerText" in input) payload.answer_text = input.answerText ?? null

  return payload
}
