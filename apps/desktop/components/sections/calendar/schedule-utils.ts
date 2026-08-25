import { isSameDay } from "date-fns"
import type { ScheduleFixture } from "@app/shared"

function getSchedulesOnDate(schedules: ScheduleFixture[], date: Date) {
  return schedules.filter((schedule) => isSameDay(new Date(schedule.date), date))
}

export { getSchedulesOnDate }
