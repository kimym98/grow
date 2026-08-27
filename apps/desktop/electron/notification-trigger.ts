/**
 * packages/shared/src/lib/notification-trigger.ts와 동일한 판정 로직의 Electron 메인 프로세스 전용 복제본.
 * 메인 프로세스는 tsc(commonjs)로 별도 컴파일되어 런타임에 @app/shared(TS 소스, ESM)를 require할 수 없어
 * (workspace 심볼릭 링크는 타입 체크 시에는 해석되지만 Node 런타임이 .ts를 직접 로드할 수 없음) 부득이 복제한다.
 * 로직을 수정할 때는 반드시 shared 쪽 원본도 함께 갱신할 것.
 */

export interface MainProcessSchedule {
  id: string
  title: string
  memo?: string
  date: string
  time?: string
  reminderTime?: string
}

const DEFAULT_DAILY_SUMMARY_TIME = { hour: 9, minute: 0 }

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function parseHourMinute(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

export function shouldTriggerReminder(schedule: MainProcessSchedule, now: Date): boolean {
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

export function shouldTriggerDailySummary(
  now: Date,
  lastSummaryAt: Date | undefined,
  summaryTime: { hour: number; minute: number } = DEFAULT_DAILY_SUMMARY_TIME
): boolean {
  if (lastSummaryAt && isSameDate(now, lastSummaryAt)) return false

  return now.getHours() === summaryTime.hour && now.getMinutes() === summaryTime.minute
}

export { parseHourMinute }
