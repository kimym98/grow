"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import type { Schedule, ScheduleChecklistItem } from "@app/shared"

import type { ScheduleFormValues } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { createSchedule, deleteSchedule, fetchSchedules, updateSchedule } from "@/lib/schedules"
import { getSchedulesOnDate } from "@/components/sections/calendar/schedule-utils"
import { MonthlyCalendarGrid } from "@/components/sections/dashboard/monthly-calendar-grid"
import { ScheduleSheet } from "@/components/sections/dashboard/schedule-sheet"

/**
 * 대시보드 홈에 통합된 캘린더 섹션
 * - 월간 그리드 + 날짜 클릭 시 우측 시트(목록/작성)로 일정 관리
 * - Supabase schedules 테이블과 직접 연동(로컬 mock 제거)
 */
function DashboardCalendarSection() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchSchedules()
      .then((data) => {
        if (!cancelled) setSchedules(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // 일정이 바뀔 때마다 Electron 메인 프로세스에 최신 목록을 동기화 (알림 발송 판정에 사용)
  useEffect(() => {
    window.electronAPI?.syncSchedules(schedules)
  }, [schedules])

  const selectedDateSchedules = getSchedulesOnDate(schedules, selectedDate)

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date)
    setSheetOpen(true)
  }, [])

  function openCreateSheet() {
    setSelectedDate(new Date())
    setSheetOpen(true)
  }

  async function handleSubmit(values: ScheduleFormValues, editingId?: string) {
    const payload = {
      title: values.title,
      memo: values.memo || undefined,
      date: values.date,
      time: values.time || undefined,
      reminderTime: values.reminderTime || undefined,
      isRecurring: values.isRecurring,
      category: values.category,
    }

    if (editingId) {
      const updated = await updateSchedule(editingId, payload)
      setSchedules((prev) => prev.map((schedule) => (schedule.id === editingId ? updated : schedule)))
      return
    }

    const created = await createSchedule({ ...payload, checklist: [] })
    setSchedules((prev) => [...prev, created])
    setSelectedDate(new Date(created.date))
  }

  async function handleChecklistChange(scheduleId: string, checklist: ScheduleChecklistItem[]) {
    const updated = await updateSchedule(scheduleId, { checklist })
    setSchedules((prev) => prev.map((schedule) => (schedule.id === scheduleId ? updated : schedule)))
  }

  async function handleDelete(scheduleId: string) {
    await deleteSchedule(scheduleId)
    setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-end">
        <Button size="sm" onClick={openCreateSheet}>
          <Plus />
          일정 추가
        </Button>
      </div>

      {isLoading ? (
        <EmptyState title="일정을 불러오는 중입니다" description="잠시만 기다려주세요" />
      ) : loadError ? (
        <EmptyState title="일정을 불러오지 못했습니다" description={loadError} />
      ) : (
        <MonthlyCalendarGrid
          className="min-h-0 flex-1"
          month={currentMonth}
          getSchedulesForDate={(date) => getSchedulesOnDate(schedules, date)}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onMonthChange={setCurrentMonth}
        />
      )}

      <ScheduleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={selectedDate}
        schedules={selectedDateSchedules}
        onSubmit={handleSubmit}
        onChecklistChange={handleChecklistChange}
        onDelete={handleDelete}
      />
    </div>
  )
}

export { DashboardCalendarSection }
