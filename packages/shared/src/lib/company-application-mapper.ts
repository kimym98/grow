import type { CompanyApplication, CompanyApplicationRow } from "../types/company-application"

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 */
export function rowToCompanyApplication(row: CompanyApplicationRow): CompanyApplication {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    companyKey: row.company_key,
    position: row.position,
    applyUrl: row.apply_url,
    appliedAt: row.applied_at,
    status: row.status,
    memo: row.memo,
    sourceJobPostingId: row.source_job_posting_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 도메인 타입(camelCase)의 일부 필드를 DB row(snake_case) insert/update payload로 변환한다.
 * id/userId/createdAt/updatedAt은 호출측(CRUD 함수)에서 별도로 채우므로 제외한다.
 */
export function companyApplicationToRowPayload(
  input: Partial<
    Pick<
      CompanyApplication,
      | "companyName"
      | "companyKey"
      | "position"
      | "applyUrl"
      | "appliedAt"
      | "status"
      | "memo"
      | "sourceJobPostingId"
    >
  >
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if ("companyName" in input) payload.company_name = input.companyName
  if ("companyKey" in input) payload.company_key = input.companyKey
  if ("position" in input) payload.position = input.position ?? null
  if ("applyUrl" in input) payload.apply_url = input.applyUrl ?? null
  if ("appliedAt" in input) payload.applied_at = input.appliedAt ?? null
  if ("status" in input) payload.status = input.status
  if ("memo" in input) payload.memo = input.memo ?? null
  if ("sourceJobPostingId" in input) payload.source_job_posting_id = input.sourceJobPostingId ?? null

  return payload
}
