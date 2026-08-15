"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Plus } from "lucide-react"
import { createScheduleFixtures, type ScheduleChecklistItem, type ScheduleFixture } from "@app/shared"

import type { ScheduleFormValues } from "@/lib/validators"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { ListDetailPanel } from "@/components/common/list-detail-panel"
import { CalendarView, type CalendarViewMode, getSchedulesOnDate } from "@/components/sections/calendar/calendar-view"
import { TodaySummaryWidget } from "@/components/sections/calendar/today-summary-widget"
import { ScheduleFormDialog } from "@/components/sections/calendar/schedule-form-dialog"
import { ChecklistPanel } from "@/components/sections/calendar/checklist-panel"
import { NotificationSettings } from "@/components/sections/calendar/notification-settings"
import { CATEGORY_LABELS } from "@/components/sections/calendar/schedule-category"

function toFormValues(schedule: ScheduleFixture): ScheduleFormValues {
  return {
    title: schedule.title,
    memo: schedule.memo ?? "",
    date: schedule.date,
    time: schedule.time ?? "",
    reminderTime: schedule.reminderTime ?? "",
    isRecurring: schedule.isRecurring,
    category: schedule.category,
  }
}

function CalendarDashboard() {
  const [schedules, setSchedules] = useState(() => createScheduleFixtures(12))
  const [view, setView] = useState<CalendarViewMode>("month")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [detailOpen, setDetailOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleFixture | null>(null)
  const [focusedScheduleId, setFocusedScheduleId] = useState<string | null>(null)

  const selectedDateSchedules = useMemo(
    () => getSchedulesOnDate(schedules, selectedDate),
    [schedules, selectedDate]
  )

  const focusedSchedule =
    selectedDateSchedules.find((schedule) => schedule.id === focusedScheduleId) ??
    selectedDateSchedules[0] ??
    null

  function handleSelectDate(date: Date) {
    setSelectedDate(date)
    setFocusedScheduleId(null)
    setDetailOpen(true)
  }

  function handleSelectSchedule(schedule: ScheduleFixture) {
    setSelectedDate(new Date(schedule.date))
    setFocusedScheduleId(schedule.id)
    setDetailOpen(true)
  }

  function openCreateDialog() {
    setEditingSchedule(null)
    setDialogOpen(true)
  }

  function openEditDialog(schedule: ScheduleFixture) {
    setEditingSchedule(schedule)
    setDialogOpen(true)
  }

  function handleSubmit(values: ScheduleFormValues) {
    if (editingSchedule) {
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === editingSchedule.id
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
    setFocusedScheduleId(newSchedule.id)
  }

  function handleChecklistChange(scheduleId: string, checklist: ScheduleChecklistItem[]) {
    setSchedules((prev) =>
      prev.map((schedule) => (schedule.id === scheduleId ? { ...schedule, checklist } : schedule))
    )
  }

  return (
    <>
      <ListDetailPanel
        className="h-full"
        showDetail={detailOpen}
        onBack={() => setDetailOpen(false)}
        list={
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-3 pt-3">
              <h1 className="text-lg font-semibold">캘린더</h1>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus />
                일정 추가
              </Button>
            </div>

            <CalendarView
              schedules={schedules}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              view={view}
              onViewChange={setView}
            />

            <TodaySummaryWidget schedules={schedules} onSelectSchedule={handleSelectSchedule} />
          </div>
        }
        detail={
          selectedDateSchedules.length === 0 ? (
            <EmptyState
              title="선택한 날짜에 일정이 없습니다"
              description="일정을 추가해보세요"
              action={{ label: "일정 추가", onClick: openCreateDialog }}
            />
          ) : (
            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })}
                </p>

                <ul className="mt-2 flex flex-col gap-1.5" role="list">
                  {selectedDateSchedules.map((schedule) => (
                    <li key={schedule.id}>
                      <button
                        type="button"
                        onClick={() => setFocusedScheduleId(schedule.id)}
                        aria-current={schedule.id === focusedSchedule?.id}
                        data-current={schedule.id === focusedSchedule?.id}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-ring/50 data-[current=true]:bg-muted"
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
              </div>

              {focusedSchedule ? (
                <div className="flex flex-col gap-4 border-t border-border/40 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{focusedSchedule.title}</p>
                      {focusedSchedule.memo ? (
                        <p className="text-sm text-muted-foreground">{focusedSchedule.memo}</p>
                      ) : null}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(focusedSchedule)}>
                      수정
                    </Button>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">체크리스트</p>
                    <ChecklistPanel
                      items={focusedSchedule.checklist ?? []}
                      onItemsChange={(checklist) =>
                        handleChecklistChange(focusedSchedule.id, checklist)
                      }
                    />
                  </div>
                </div>
              ) : null}

              <NotificationSettings />
            </div>
          )
        }
      />

      <ScheduleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editingSchedule ? toFormValues(editingSchedule) : undefined}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export { CalendarDashboard }
