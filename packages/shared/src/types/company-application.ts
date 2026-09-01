export type CompanyApplicationStatus =
  | "준비중"
  | "서류제출"
  | "서류합격"
  | "테스트"
  | "면접"
  | "최종합격"
  | "탈락"

/** 지원 기업 도메인 타입 (camelCase) */
export interface CompanyApplication {
  id: string
  userId: string
  companyName: string
  companyKey: string
  position: string | null
  applyUrl: string | null
  appliedAt: string | null
  status: CompanyApplicationStatus
  memo: string | null
  sourceJobPostingId: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Supabase company_applications 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 supabase/migrations/20260901010000_add_company_applications.sql 참고
 */
export interface CompanyApplicationRow {
  id: string
  user_id: string
  company_name: string
  company_key: string
  position: string | null
  apply_url: string | null
  applied_at: string | null
  status: CompanyApplicationStatus
  memo: string | null
  source_job_posting_id: string | null
  created_at: string
  updated_at: string
}
