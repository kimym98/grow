import { z } from "zod"

/**
 * IT 뉴스 도메인 엔티티(DB 레코드) 검증 스키마
 * 북마크 여부(isBookmarked)는 사용자별 데이터이므로 실제로는 별도 북마크 테이블 분리를 고려할 수 있음
 * (docs/database-schema.md 참고), 여기서는 조회 시 조인된 결과 형태로 정의
 */
export const techNewsSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  summary: z.string(),
  source: z.string(),
  publishedAt: z.string(),
  url: z.string().url(),
  isBookmarked: z.boolean(),
  userId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type TechNewsSchema = z.infer<typeof techNewsSchema>
