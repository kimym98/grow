import type { CsQuestion } from "../types/cs-question"

/**
 * Supabase cs_questions 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 docs/database-schema.md 참고
 */
export interface CsQuestionRow {
  id: string
  category: string
  question: string
  answer: string
  question_type: "multiple-choice" | "short-answer"
  choices: string[] | null
  correct_index: number | null
  created_at: string
  updated_at: string
}

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 * question_type에 따라 discriminatedUnion 분기에 맞는 형태로 조립한다.
 */
export function rowToCsQuestion(row: CsQuestionRow): CsQuestion {
  const base = {
    id: row.id,
    category: row.category as CsQuestion["category"],
    question: row.question,
    answer: row.answer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  if (row.question_type === "multiple-choice") {
    return {
      ...base,
      questionType: "multiple-choice",
      choices: row.choices ?? [],
      correctIndex: row.correct_index ?? 0,
    }
  }

  return {
    ...base,
    questionType: "short-answer",
  }
}
