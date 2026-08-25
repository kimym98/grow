import type { scheduleChecklistItemSchema, scheduleSchema } from "../schemas/schedule"
import type { z } from "zod"

export type ScheduleChecklistItem = z.infer<typeof scheduleChecklistItemSchema>
export type Schedule = z.infer<typeof scheduleSchema>
