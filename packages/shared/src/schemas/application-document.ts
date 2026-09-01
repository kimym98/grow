import { z } from "zod"

/**
 * 지원 기업 제출 서류 연결 도메인 엔티티(DB 레코드) 검증 스키마
 * DB 컬럼(snake_case) ↔ 도메인 필드(camelCase) 매핑은 docs/database-schema.md 참고
 */
export const applicationDocumentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  applicationId: z.string(),
  documentReviewId: z.string(),
  submittedAt: z.string().nullable(),
  memo: z.string().nullable(),
  createdAt: z.string(),
})

export type ApplicationDocumentSchema = z.infer<typeof applicationDocumentSchema>
