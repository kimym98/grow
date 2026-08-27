import type { Schedule, ScheduleChecklistItem } from "../types/schedule"

/**
 * Supabase schedules 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 docs/database-schema.md 참고
 */
export interface ScheduleRow {
  id: string
  user_id: string
  title: string
  memo: string | null
  date: string
  time: string | null
  reminder_time: string | null
  category: string
  is_recurring: boolean
  checklist: ScheduleChecklistItem[]
  created_at: string
  updated_at: string
}

/** Postgres time 타입("HH:mm:ss")을 폼에서 쓰는 "HH:mm" 형식으로 자른다 */
function toShortTime(value: string | null): string | undefined {
  return value ? value.slice(0, 5) : undefined
}

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 */
export function rowToSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    memo: row.memo ?? undefined,
    date: row.date,
    time: toShortTime(row.time),
    reminderTime: toShortTime(row.reminder_time),
    category: row.category as Schedule["category"],
    isRecurring: row.is_recurring,
    checklist: row.checklist ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 도메인 타입(camelCase)의 일부 필드를 DB row(snake_case) insert/update payload로 변환한다.
 * id/userId/createdAt/updatedAt은 호출측(CRUD 함수)에서 별도로 채우므로 제외한다.
 */
export function scheduleToRowPayload(
  input: Partial<
    Pick<
      Schedule,
      "title" | "memo" | "date" | "time" | "reminderTime" | "category" | "isRecurring" | "checklist"
    >
  >
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if ("title" in input) payload.title = input.title
  if ("memo" in input) payload.memo = input.memo ?? null
  if ("date" in input) payload.date = input.date
  if ("time" in input) payload.time = input.time ?? null
  if ("reminderTime" in input) payload.reminder_time = input.reminderTime ?? null
  if ("category" in input) payload.category = input.category
  if ("isRecurring" in input) payload.is_recurring = input.isRecurring
  if ("checklist" in input) payload.checklist = input.checklist ?? []

  return payload
}
