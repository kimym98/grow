import { z } from "zod"

export const csQuestionCategorySchema = z.enum(["network", "database", "os", "data-structure"])

/**
 * CS 면접 퀴즈 문제 도메인 엔티티(DB 레코드) 검증 스키마
 */
export const csQuestionSchema = z.object({
  id: z.string(),
  category: csQuestionCategorySchema,
  question: z.string().min(1),
  answer: z.string().min(1),
  choices: z.array(z.string()),
  correctIndex: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CsQuestionSchema = z.infer<typeof csQuestionSchema>
