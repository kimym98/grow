export type CompanyAnalysisStatus = "processing" | "completed" | "failed"

/** 지원 기업 LLM 분석 도메인 타입 (camelCase) */
export interface CompanyAnalysis {
  id: string
  userId: string
  applicationId: string
  status: CompanyAnalysisStatus
  summary: string | null
  cultureFit: string | null
  businessDomain: string | null
  techStack: string | null
  expectedQuestions: unknown | null
  inputSnapshot: unknown | null
  cacheKey: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Supabase company_analyses 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 supabase/migrations/20260901020000_add_company_analyses.sql 참고
 */
export interface CompanyAnalysisRow {
  id: string
  user_id: string
  application_id: string
  status: CompanyAnalysisStatus
  summary: string | null
  culture_fit: string | null
  business_domain: string | null
  tech_stack: string | null
  expected_questions: unknown | null
  input_snapshot: unknown | null
  cache_key: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}
