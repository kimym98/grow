import type { techNewsSchema } from "../schemas/tech-news"
import type { z } from "zod"

export type TechNews = z.infer<typeof techNewsSchema>
