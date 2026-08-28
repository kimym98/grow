import { z } from "zod"

export const csQuestionCategorySchema = z.enum([
  "network",
  "database",
  "os",
  "data-structure",
  "ai-llm",
  "frontend",
])

export const questionTypeSchema = z.enum(["multiple-choice", "short-answer"])

const csQuestionBaseSchema = z.object({
  id: z.string(),
  category: csQuestionCategorySchema,
  question: z.string().min(1),
  answer: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
})

/**
 * 4지선다 객관식 문제 스키마 - choices/correctIndex 필수
 */
const multipleChoiceQuestionSchema = csQuestionBaseSchema.extend({
  questionType: z.literal("multiple-choice"),
  choices: z.array(z.string()),
  correctIndex: z.number().int().nonnegative(),
})

/**
 * 서술형 문제 스키마 - choices/correctIndex 없음(answer가 AI 채점 기준 모범답안 역할)
 */
const shortAnswerQuestionSchema = csQuestionBaseSchema.extend({
  questionType: z.literal("short-answer"),
})

/**
 * CS 면접 퀴즈 문제 도메인 엔티티(DB 레코드) 검증 스키마
 * questionType 판별자로 객관식/서술형 필드 조합을 타입 레벨에서 강제한다
 */
export const csQuestionSchema = z.discriminatedUnion("questionType", [
  multipleChoiceQuestionSchema,
  shortAnswerQuestionSchema,
])

export type CsQuestionSchema = z.infer<typeof csQuestionSchema>
