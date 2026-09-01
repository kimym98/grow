/** 지원 기업 제출 서류 연결(company_applications ↔ document_reviews) 도메인 타입 (camelCase) */
export interface ApplicationDocument {
  id: string
  userId: string
  applicationId: string
  documentReviewId: string
  submittedAt: string | null
  memo: string | null
  createdAt: string
}

/**
 * Supabase application_documents 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 supabase/migrations/20260901050000_add_application_documents.sql 참고
 */
export interface ApplicationDocumentRow {
  id: string
  user_id: string
  application_id: string
  document_review_id: string
  submitted_at: string | null
  memo: string | null
  created_at: string
}
