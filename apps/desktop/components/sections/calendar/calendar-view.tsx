"use client"

import { addDays, eachDayOfInterval, format, isSameDay, startOfWeek } from "date-fns"
import { ko } from "date-fns/locale"
import type { ScheduleFixture } from "@app/shared"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type CalendarViewMode = "month" | "week"

interface CalendarViewProps {
  schedules: ScheduleFixture[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  view: CalendarViewMode
  onViewChange: (view: CalendarViewMode) => void
}

function getSchedulesOnDate(schedules: ScheduleFixture[], date: Date) {
  return schedules.filter((schedule) => isSameDay(new Date(schedule.date), date))
}

function CalendarView({
  schedules,
  selectedDate,
  onSelectDate,
  view,
  onViewChange,
}: CalendarViewProps) {
  const scheduledDates = schedules.map((schedule) => new Date(schedule.date))

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
    end: addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), 6),
  })

  return (
    <Tabs value={view} onValueChange={(value) => onViewChange(value as CalendarViewMode)}>
      <div className="flex items-center justify-between px-3 pt-3">
        <TabsList aria-label="캘린더 보기 전환">
          <TabsTrigger value="month">월</TabsTrigger>
          <TabsTrigger value="week">주</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="month" className="p-3">
        <Calendar
          mode="single"
          locale={ko}
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          modifiers={{ hasSchedule: scheduledDates }}
          modifiersClassNames={{
            hasSchedule: "after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
          }}
        />
      </TabsContent>

      <TabsContent value="week" className="p-3">
        <ul className="grid grid-cols-7 gap-1.5" role="list">
          {weekDays.map((day) => {
            const daySchedules = getSchedulesOnDate(schedules, day)
            const isSelected = isSameDay(day, selectedDate)

            return (
              <li key={day.toISOString()}>
                <button
                  type="button"
                  onClick={() => onSelectDate(day)}
                  aria-current={isSelected}
                  data-current={isSelected}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl p-2 text-center text-xs ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-ring/50 data-[current=true]:bg-primary data-[current=true]:text-primary-foreground data-[current=true]:ring-primary"
                >
                  <span className="text-[0.7rem] text-muted-foreground group-data-[current=true]:text-primary-foreground">
                    {format(day, "EEE", { locale: ko })}
                  </span>
                  <span className="text-sm font-medium">{format(day, "d")}</span>
                  {daySchedules.length > 0 ? (
                    <Badge
                      variant={isSelected ? "secondary" : "outline"}
                      className={cn(isSelected && "bg-background/20 text-inherit")}
                    >
                      {daySchedules.length}
                    </Badge>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </TabsContent>
    </Tabs>
  )
}

export { CalendarView, getSchedulesOnDate }
