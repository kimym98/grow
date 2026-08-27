import { rowToSchedule, scheduleToRowPayload, type Schedule, type ScheduleRow } from "@app/shared"

import { supabase } from "@/lib/supabase"

type ScheduleInput = Pick<
  Schedule,
  "title" | "memo" | "date" | "time" | "reminderTime" | "category" | "isRecurring" | "checklist"
>

/** schedules 테이블에서 로그인한 사용자의 전체 일정을 날짜순으로 조회한다 (RLS로 소유자 데이터만 반환) */
export async function fetchSchedules(): Promise<Schedule[]> {
  const { data, error } = await supabase.from("schedules").select("*").order("date")

  if (error) throw new Error(error.message)

  return (data as ScheduleRow[]).map(rowToSchedule)
}

/** 새 일정을 생성한다 (user_id는 현재 로그인 세션에서 획득) */
export async function createSchedule(input: ScheduleInput): Promise<Schedule> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const payload = {
    ...scheduleToRowPayload(input),
    user_id: userData.user.id,
  }

  const { data, error } = await supabase.from("schedules").insert(payload).select().single()

  if (error) throw new Error(error.message)

  return rowToSchedule(data as ScheduleRow)
}

/** 일정을 부분 수정한다 (체크리스트만 갱신하는 경우에도 사용) */
export async function updateSchedule(id: string, patch: Partial<ScheduleInput>): Promise<Schedule> {
  const { data, error } = await supabase
    .from("schedules")
    .update(scheduleToRowPayload(patch))
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return rowToSchedule(data as ScheduleRow)
}

/** 일정을 삭제한다 */
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("schedules").delete().eq("id", id)

  if (error) throw new Error(error.message)
}
