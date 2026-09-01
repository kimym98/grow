import type { ApplicationDocument, ApplicationDocumentRow } from "../types/application-document"

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 */
export function rowToApplicationDocument(row: ApplicationDocumentRow): ApplicationDocument {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    documentReviewId: row.document_review_id,
    submittedAt: row.submitted_at,
    memo: row.memo,
    createdAt: row.created_at,
  }
}

/**
 * 도메인 타입(camelCase)의 일부 필드를 DB row(snake_case) insert/update payload로 변환한다.
 * id/userId/applicationId/documentReviewId/createdAt은 호출측(CRUD 함수)에서 별도로 채우므로 제외한다.
 */
export function applicationDocumentToRowPayload(
  input: Partial<Pick<ApplicationDocument, "submittedAt" | "memo">>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if ("submittedAt" in input) payload.submitted_at = input.submittedAt ?? null
  if ("memo" in input) payload.memo = input.memo ?? null

  return payload
}
