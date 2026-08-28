import { z } from "zod"
import { csQuestionCategorySchema } from "./cs-question"

/**
 * 퀴즈 세션 카테고리 - 단일 카테고리 또는 전체 카테고리를 아우르는 모의고사('mixed')
 */
export const quizSessionCategorySchema = z.union([csQuestionCategorySchema, z.literal("mixed")])

/**
 * 퀴즈 풀이 세션 도메인 엔티티(DB 레코드) 검증 스키마
 */
export const quizSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: quizSessionCategorySchema,
  totalCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  createdAt: z.string(),
})

export type QuizSessionSchema = z.infer<typeof quizSessionSchema>

/**
 * 사용자가 퀴즈 세션에서 제출한 개별 답안 도메인 엔티티(DB 레코드) 검증 스키마
 * 객관식은 selected/isCorrect, 서술형은 answerText/aiScore/aiFeedback(+계산된 isCorrect)을 사용한다
 */
export const userAnswerSchema = z.object({
  id: z.string(),
  quizSessionId: z.string(),
  questionId: z.string(),
  selected: z.number().int().nonnegative().optional(),
  answerText: z.string().optional(),
  aiScore: z.number().int().min(0).max(100).optional(),
  aiFeedback: z.string().optional(),
  isCorrect: z.boolean(),
  createdAt: z.string(),
})

export type UserAnswerSchema = z.infer<typeof userAnswerSchema>
