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
 * 예상 면접 질문 스키마 (Task 037)
 * sourceQuote는 선택 사항이며 원문과의 매칭·offset 계산은 수행하지 않는다(하이라이트 기능 폐기)
 */
export const documentInterviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  intent: z.string(),
  category: z.string(),
  sourceQuote: z.string().optional(),
})

export type DocumentInterviewQuestionSchema = z.infer<typeof documentInterviewQuestionSchema>

/**
 * 문서 첨삭 도메인 엔티티(DB 레코드) 검증 스키마
 * 업로드 유형은 이력서(resume)/포트폴리오(portfolio) 2종으로 한정하며, LLM 분석 결과는
 * 원문(originalText)과 유형별 관점의 코멘트(comments), 예상 면접 질문(interviewQuestions)을 생성한다
 * (전체 첨삭본·비교뷰는 산출하지 않음)
 * (docs/database-schema.md 참고)
 */
export const documentReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  type: documentTypeSchema,
  status: documentReviewStatusSchema,
  version: z.number().int().positive(),
  originalText: z.string(),
  versions: z.array(documentReviewVersionSchema),
  comments: z.array(documentReviewCommentSchema),
  interviewQuestions: z.array(documentInterviewQuestionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type DocumentReviewSchema = z.infer<typeof documentReviewSchema>
