import type { quizSessionSchema, userAnswerSchema } from "../schemas/quiz-session"
import type { z } from "zod"

export type QuizSession = z.infer<typeof quizSessionSchema>
export type UserAnswer = z.infer<typeof userAnswerSchema>
