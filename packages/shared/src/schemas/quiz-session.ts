import { z } from "zod"
import { csQuestionCategorySchema } from "./cs-question"

/**
 * 퀴즈 풀이 세션 도메인 엔티티(DB 레코드) 검증 스키마
 */
export const quizSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: csQuestionCategorySchema,
  totalCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  createdAt: z.string(),
})

export type QuizSessionSchema = z.infer<typeof quizSessionSchema>

/**
 * 사용자가 퀴즈 세션에서 제출한 개별 답안 도메인 엔티티(DB 레코드) 검증 스키마
 */
export const userAnswerSchema = z.object({
  id: z.string(),
  quizSessionId: z.string(),
  questionId: z.string(),
  selected: z.number().int().nonnegative(),
  isCorrect: z.boolean(),
  createdAt: z.string(),
})

export type UserAnswerSchema = z.infer<typeof userAnswerSchema>
