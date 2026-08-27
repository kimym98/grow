import { z } from "zod"

/**
 * 채용 공고 도메인 엔티티(DB 레코드) 검증 스키마
 * DB 컬럼(snake_case) ↔ 도메인 필드(camelCase) 매핑은 docs/database-schema.md 참고
 */
export const jobPostingSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string(),
  careerLevel: z.string(),
  deadline: z.string().nullable(),
  tags: z.array(z.string()),
  url: z.string().url(),
  sourceUrl: z.string().url(),
  source: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type JobPostingSchema = z.infer<typeof jobPostingSchema>
