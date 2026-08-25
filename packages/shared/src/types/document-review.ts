import type {
  documentReviewCommentSchema,
  documentReviewSchema,
  documentReviewVersionSchema,
} from "../schemas/document-review"
import type { z } from "zod"

export type DocumentReviewVersion = z.infer<typeof documentReviewVersionSchema>
export type DocumentReviewComment = z.infer<typeof documentReviewCommentSchema>
export type DocumentReview = z.infer<typeof documentReviewSchema>
