import { z } from "zod"

export const companyApplicationStatusSchema = z.enum([
  "준비중",
  "서류제출",
  "서류합격",
  "테스트",
  "면접",
  "최종합격",
  "탈락",
])

/**
 * 지원 기업 도메인 엔티티(DB 레코드) 검증 스키마
 * DB 컬럼(snake_case) ↔ 도메인 필드(camelCase) 매핑은 docs/database-schema.md 참고
 */
export const companyApplicationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  companyName: z.string().min(1),
  companyKey: z.string().min(1),
  position: z.string().nullable(),
  applyUrl: z.string().nullable(),
  appliedAt: z.string().nullable(),
  status: companyApplicationStatusSchema,
  memo: z.string().nullable(),
  sourceJobPostingId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CompanyApplicationSchema = z.infer<typeof companyApplicationSchema>
