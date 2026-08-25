import type { csQuestionSchema } from "../schemas/cs-question"
import type { z } from "zod"

export type CsQuestion = z.infer<typeof csQuestionSchema>
