import type { QuizSession, UserAnswer } from "../types/quiz-session"

/**
 * Supabase quiz_sessions 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 docs/database-schema.md 참고
 */
export interface QuizSessionRow {
  id: string
  user_id: string
  category: string
  total_count: number
  correct_count: number
  created_at: string
}

export function rowToQuizSession(row: QuizSessionRow): QuizSession {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category as QuizSession["category"],
    totalCount: row.total_count,
    correctCount: row.correct_count,
    createdAt: row.created_at,
  }
}

/**
 * Supabase user_answers 테이블의 DB row 형태 (snake_case)
 */
export interface UserAnswerRow {
  id: string
  quiz_session_id: string
  question_id: string
  selected: number | null
  answer_text: string | null
  ai_score: number | null
  ai_feedback: string | null
  is_correct: boolean
  created_at: string
}

export function rowToUserAnswer(row: UserAnswerRow): UserAnswer {
  return {
    id: row.id,
    quizSessionId: row.quiz_session_id,
    questionId: row.question_id,
    selected: row.selected ?? undefined,
    answerText: row.answer_text ?? undefined,
    aiScore: row.ai_score ?? undefined,
    aiFeedback: row.ai_feedback ?? undefined,
    isCorrect: row.is_correct,
    createdAt: row.created_at,
  }
}
