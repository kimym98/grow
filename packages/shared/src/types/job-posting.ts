import type { jobPostingSchema } from "../schemas/job-posting"
import type { z } from "zod"

export type JobPosting = z.infer<typeof jobPostingSchema>
