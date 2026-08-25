import { z } from "zod"

export const scheduleCategorySchema = z.enum(["interview", "deadline", "study", "etc"])

export const scheduleChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  done: z.boolean(),
})

export type ScheduleChecklistItemSchema = z.infer<typeof scheduleChecklistItemSchema>

/**
 * 일정 도메인 엔티티(DB 레코드) 검증 스키마
 */
export const scheduleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  memo: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  reminderTime: z.string().optional(),
  category: scheduleCategorySchema,
  isRecurring: z.boolean(),
  checklist: z.array(scheduleChecklistItemSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ScheduleSchema = z.infer<typeof scheduleSchema>
