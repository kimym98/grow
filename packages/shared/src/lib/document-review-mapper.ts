import type {
  DocumentInterviewQuestion,
  DocumentReview,
  DocumentReviewComment,
  DocumentReviewVersion,
} from "../types/document-review"

/**
 * Supabase document_reviews 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 docs/database-schema.md 참고
 */
export interface DocumentReviewRow {
  id: string
  user_id: string
  title: string
  type: string
  status: string
  version: number
  original_text: string
  versions: DocumentReviewVersion[]
  comments: DocumentReviewComment[]
  interview_questions: DocumentInterviewQuestion[]
  created_at: string
  updated_at: string
}

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 */
export function rowToDocumentReview(row: DocumentReviewRow): DocumentReview {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    type: row.type as DocumentReview["type"],
    status: row.status as DocumentReview["status"],
    version: row.version,
    originalText: row.original_text,
    versions: row.versions ?? [],
    comments: row.comments ?? [],
    interviewQuestions: row.interview_questions ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
