"use client"

import { useCallback, useState } from "react"
import { Plus } from "lucide-react"
import { createScheduleFixtures, type ScheduleChecklistItem, type ScheduleFixture } from "@app/shared"

import type { ScheduleFormValues } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { getSchedulesOnDate } from "@/components/sections/calendar/schedule-utils"
import { MonthlyCalendarGrid } from "@/components/sections/dashboard/monthly-calendar-grid"
import { ScheduleSheet } from "@/components/sections/dashboard/schedule-sheet"

/**
 * 대시보드 홈에 통합된 캘린더 섹션
 * - 월간 그리드 + 날짜 클릭 시 우측 시트(목록/작성)로 일정 관리
 * - 전역 스토어 없이 로컬 state로 일정 목록을 관리 (mock 데이터 초기화)
 */
function DashboardCalendarSection() {
  const [schedules, setSchedules] = useState(() => createScheduleFixtures(12))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [sheetOpen, setSheetOpen] = useState(false)

  const selectedDateSchedules = getSchedulesOnDate(schedules, selectedDate)

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date)
    setSheetOpen(true)
  }, [])

  function openCreateSheet() {
    setSelectedDate(new Date())
    setSheetOpen(true)
  }

  function handleSubmit(values: ScheduleFormValues, editingId?: string) {
    if (editingId) {
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === editingId
            ? {
                ...schedule,
                title: values.title,
                memo: values.memo || undefined,
                date: values.date,
                time: values.time || undefined,
                reminderTime: values.reminderTime || undefined,
                isRecurring: values.isRecurring,
                category: values.category,
              }
            : schedule
        )
      )
      return
    }

    const newSchedule: ScheduleFixture = {
      id: crypto.randomUUID(),
      title: values.title,
      memo: values.memo || undefined,
      date: values.date,
      time: values.time || undefined,
      reminderTime: values.reminderTime || undefined,
      isRecurring: values.isRecurring,
      category: values.category,
      checklist: [],
    }
    setSchedules((prev) => [...prev, newSchedule])
    setSelectedDate(new Date(newSchedule.date))
  }

  function handleChecklistChange(scheduleId: string, checklist: ScheduleChecklistItem[]) {
    setSchedules((prev) =>
      prev.map((schedule) => (schedule.id === scheduleId ? { ...schedule, checklist } : schedule))
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-end">
        <Button size="sm" onClick={openCreateSheet}>
          <Plus />
          일정 추가
        </Button>
      </div>

      <MonthlyCalendarGrid
        className="min-h-0 flex-1"
        month={currentMonth}
        getSchedulesForDate={(date) => getSchedulesOnDate(schedules, date)}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onMonthChange={setCurrentMonth}
      />

      <ScheduleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={selectedDate}
        schedules={selectedDateSchedules}
        onSubmit={handleSubmit}
        onChecklistChange={handleChecklistChange}
      />
    </div>
  )
}

export { DashboardCalendarSection }
