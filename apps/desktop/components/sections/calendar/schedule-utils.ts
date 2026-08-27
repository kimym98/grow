import { isSameDay } from "date-fns"
import type { Schedule } from "@app/shared"

function getSchedulesOnDate(schedules: Schedule[], date: Date) {
  return schedules.filter((schedule) => isSameDay(new Date(schedule.date), date))
}

export { getSchedulesOnDate }
