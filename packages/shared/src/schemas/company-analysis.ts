import { z } from "zod"

export const companyAnalysisStatusSchema = z.enum(["processing", "completed", "failed"])

/**
 * analyze-company Edge Function 요청 바디 검증 스키마
 */
export const triggerCompanyAnalysisSchema = z.object({
  applicationId: z.string().uuid(),
  provider: z.enum(["gemini", "anthropic"]),
})

export type TriggerCompanyAnalysisSchema = z.infer<typeof triggerCompanyAnalysisSchema>

/**
 * 지원 기업 LLM 분석 도메인 엔티티(DB 레코드) 검증 스키마
 */
export const companyAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  applicationId: z.string(),
  status: companyAnalysisStatusSchema,
  summary: z.string().nullable(),
  cultureFit: z.string().nullable(),
  businessDomain: z.string().nullable(),
  techStack: z.string().nullable(),
  expectedQuestions: z.unknown().nullable(),
  inputSnapshot: z.unknown().nullable(),
  cacheKey: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CompanyAnalysisSchema = z.infer<typeof companyAnalysisSchema>
