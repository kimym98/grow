import type { CompanyAnalysis, CompanyAnalysisRow } from "../types/company-analysis"

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 */
export function rowToCompanyAnalysis(row: CompanyAnalysisRow): CompanyAnalysis {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    status: row.status,
    summary: row.summary,
    cultureFit: row.culture_fit,
    businessDomain: row.business_domain,
    techStack: row.tech_stack,
    expectedQuestions: row.expected_questions,
    inputSnapshot: row.input_snapshot,
    cacheKey: row.cache_key,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
