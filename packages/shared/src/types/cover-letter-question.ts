export type CoverLetterQuestionFeedbackStatus = "idle" | "processing" | "completed" | "failed"

/** 자소서 문항·답변 도메인 타입 (camelCase) */
export interface CoverLetterQuestion {
  id: string
  userId: string
  applicationId: string
  orderIndex: number
  questionText: string
  charLimit: number | null
  answerText: string | null
  feedbackStatus: CoverLetterQuestionFeedbackStatus
  feedbackText: string | null
  feedbackErrorMessage: string | null
  feedbackGeneratedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Supabase cover_letter_questions 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 supabase/migrations/20260901030000_add_cover_letter_questions.sql,
 * 20260901040000_add_cover_letter_question_feedback.sql 참고
 */
export interface CoverLetterQuestionRow {
  id: string
  user_id: string
  application_id: string
  order_index: number
  question_text: string
  char_limit: number | null
  answer_text: string | null
  feedback_status: CoverLetterQuestionFeedbackStatus
  feedback_text: string | null
  feedback_error_message: string | null
  feedback_generated_at: string | null
  created_at: string
  updated_at: string
}
