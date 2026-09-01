import { z } from "zod"

/**
 * 자소서 문항·답변 도메인 엔티티(DB 레코드) 검증 스키마
 * DB 컬럼(snake_case) ↔ 도메인 필드(camelCase) 매핑은 docs/database-schema.md 참고
 */
export const coverLetterQuestionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  applicationId: z.string(),
  orderIndex: z.number(),
  questionText: z.string().min(1),
  charLimit: z.number().nullable(),
  answerText: z.string().nullable(),
  feedbackStatus: z.enum(["idle", "processing", "completed", "failed"]),
  feedbackText: z.string().nullable(),
  feedbackErrorMessage: z.string().nullable(),
  feedbackGeneratedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CoverLetterQuestionSchema = z.infer<typeof coverLetterQuestionSchema>
