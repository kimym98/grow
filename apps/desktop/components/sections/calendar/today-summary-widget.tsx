"use client"

import { isSameDay } from "date-fns"
import { CalendarCheck } from "lucide-react"
import type { ScheduleFixture } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { CATEGORY_LABELS } from "@/components/sections/calendar/schedule-category"

interface TodaySummaryWidgetProps {
  schedules: ScheduleFixture[]
  onSelectSchedule?: (schedule: ScheduleFixture) => void
}

function TodaySummaryWidget({ schedules, onSelectSchedule }: TodaySummaryWidgetProps) {
  const today = new Date()
  const todaySchedules = schedules.filter((schedule) =>
    isSameDay(new Date(schedule.date), today)
  )

  return (
    <Card className="mx-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <CalendarCheck className="size-4 text-primary" />
          오늘 일정
        </CardTitle>
      </CardHeader>

      <CardContent>
        {todaySchedules.length === 0 ? (
          <EmptyState title="오늘 등록된 일정이 없습니다" className="p-0" />
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {todaySchedules.map((schedule) => (
              <li key={schedule.id}>
                <button
                  type="button"
                  onClick={() => onSelectSchedule?.(schedule)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{schedule.title}</span>
                    {schedule.time ? (
                      <span className="text-xs text-muted-foreground">{schedule.time}</span>
                    ) : null}
                  </span>
                  <Badge variant="outline">{CATEGORY_LABELS[schedule.category]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export { TodaySummaryWidget }
