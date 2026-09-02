import type {
  documentInterviewQuestionSchema,
  documentReviewCommentSchema,
  documentReviewSchema,
  documentReviewVersionSchema,
} from "../schemas/document-review"
import type { z } from "zod"

export type DocumentReviewVersion = z.infer<typeof documentReviewVersionSchema>
export type DocumentReviewComment = z.infer<typeof documentReviewCommentSchema>
export type DocumentInterviewQuestion = z.infer<typeof documentInterviewQuestionSchema>
export type DocumentReview = z.infer<typeof documentReviewSchema>
