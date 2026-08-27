import type { Schedule } from "../types/schedule"
import type { NotificationTrigger } from "../types/notification-trigger"

/** 당일 요약 알림 기본 시각 (사용자 설정이 없을 때 사용) */
const DEFAULT_DAILY_SUMMARY_TIME = { hour: 9, minute: 0 }

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** "HH:mm" 문자열을 { hour, minute }으로 파싱한다. 형식이 올바르지 않으면 null */
function parseHourMinute(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

/**
 * 일정의 알림 시각(reminderTime 우선, 없으면 time)이 now와 분 단위로 일치하는지 판정한다.
 * date/시각이 없으면 알림 대상이 아니다.
 */
function shouldTriggerReminder(schedule: Schedule, now: Date): boolean {
  const targetTime = schedule.reminderTime ?? schedule.time
  if (!targetTime) return false

  const parsedTime = parseHourMinute(targetTime)
  if (!parsedTime) return false

  const [year, month, day] = schedule.date.split("-").map(Number)
  if (!year || !month || !day) return false

  return (
    now.getFullYear() === year &&
    now.getMonth() === month - 1 &&
    now.getDate() === day &&
    now.getHours() === parsedTime.hour &&
    now.getMinutes() === parsedTime.minute
  )
}

/**
 * now가 당일 요약 알림 목표 시각(기본 09:00, summaryTime으로 재정의 가능)과 분 단위로 일치하고,
 * 오늘 아직 발송하지 않았으면(lastSummaryAt이 오늘이 아니면) true
 */
function shouldTriggerDailySummary(
  now: Date,
  lastSummaryAt?: Date,
  summaryTime: { hour: number; minute: number } = DEFAULT_DAILY_SUMMARY_TIME
): boolean {
  if (lastSummaryAt && isSameDate(now, lastSummaryAt)) return false

  return now.getHours() === summaryTime.hour && now.getMinutes() === summaryTime.minute
}

export const notificationTrigger: NotificationTrigger = {
  shouldTriggerReminder,
  shouldTriggerDailySummary,
}

export { shouldTriggerReminder, shouldTriggerDailySummary, parseHourMinute }
