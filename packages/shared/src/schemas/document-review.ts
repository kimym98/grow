import { z } from "zod"

export const documentTypeSchema = z.enum(["resume", "portfolio"])

export const documentReviewStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
])

export const documentReviewVersionSchema = z.object({
  version: z.number().int().positive(),
  createdAt: z.string(),
  summary: z.string(),
})

export type DocumentReviewVersionSchema = z.infer<typeof documentReviewVersionSchema>

export const documentReviewCommentSchema = z.object({
  id: z.string(),
  quote: z.string(),
  comment: z.string(),
})

export type DocumentReviewCommentSchema = z.infer<typeof documentReviewCommentSchema>

/**
 * 문서 첨삭 도메인 엔티티(DB 레코드) 검증 스키마
 * mocks의 diffSegments는 UI 렌더링용 파생 데이터이므로 DB에는 저장하지 않고,
 * originalText/reviewedText 원문을 저장한 뒤 클라이언트에서 diff를 계산하는 방식으로 설계함
 * (docs/database-schema.md 참고)
 */
export const documentReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  type: documentTypeSchema,
  status: documentReviewStatusSchema,
  version: z.number().int().positive(),
  resumeQuestion: z.string().optional(),
  originalText: z.string(),
  reviewedText: z.string().optional(),
  versions: z.array(documentReviewVersionSchema),
  comments: z.array(documentReviewCommentSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type DocumentReviewSchema = z.infer<typeof documentReviewSchema>
