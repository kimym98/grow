"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon, Plus } from "lucide-react"
import type { ScheduleChecklistItem, ScheduleFixture } from "@app/shared"

import { scheduleFormSchema, type ScheduleFormValues } from "@/lib/validators"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ChecklistPanel } from "@/components/sections/calendar/checklist-panel"
import { CATEGORY_LABELS } from "@/components/sections/calendar/schedule-category"

interface ScheduleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  schedules: ScheduleFixture[]
  onSubmit: (values: ScheduleFormValues, editingId?: string) => void
  onChecklistChange: (scheduleId: string, checklist: ScheduleChecklistItem[]) => void
}

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

function defaultValuesForDate(date: Date): ScheduleFormValues {
  return {
    title: "",
    memo: "",
    date: format(date, "yyyy-MM-dd"),
    time: "",
    reminderTime: "",
    isRecurring: false,
    category: "etc",
  }
}

/**
 * 대시보드 캘린더에서 날짜를 클릭했을 때 우측에서 열리는 시트
 * - 해당 날짜에 일정이 있으면 목록(list) 모드로 시작, 없으면 바로 작성(form) 모드로 시작
 * - 목록에서 항목을 선택하거나 "일정 추가"를 누르면 form 모드로 전환
 */
function ScheduleSheet({
  open,
  onOpenChange,
  date,
  schedules,
  onSubmit,
  onChecklistChange,
}: ScheduleSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full dark:bg-[#121212] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{format(date, "yyyy년 M월 d일 (EEE)", { locale: ko })}</SheetTitle>
        </SheetHeader>

        {/* 날짜가 바뀔 때마다 body를 새로 마운트하여 list/form 초기 모드를 재계산한다 */}
        {open ? (
          <ScheduleSheetBody
            key={date.toISOString()}
            date={date}
            schedules={schedules}
            onSubmit={onSubmit}
            onChecklistChange={onChecklistChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

interface ScheduleSheetBodyProps {
  date: Date
  schedules: ScheduleFixture[]
  onSubmit: (values: ScheduleFormValues, editingId?: string) => void
  onChecklistChange: (scheduleId: string, checklist: ScheduleChecklistItem[]) => void
}

function ScheduleSheetBody({ date, schedules, onSubmit, onChecklistChange }: ScheduleSheetBodyProps) {
  const [mode, setMode] = useState<"list" | "form">(schedules.length > 0 ? "list" : "form")
  const [editingSchedule, setEditingSchedule] = useState<ScheduleFixture | null>(null)

  function openCreateForm() {
    setEditingSchedule(null)
    setMode("form")
  }

  function openEditForm(schedule: ScheduleFixture) {
    setEditingSchedule(schedule)
    setMode("form")
  }

  function handleFormSubmit(values: ScheduleFormValues) {
    onSubmit(values, editingSchedule?.id)
    setMode("list")
    setEditingSchedule(null)
  }

  return mode === "list" ? (
    <ScheduleListView
      schedules={schedules}
      onEdit={openEditForm}
      onCreate={openCreateForm}
      onChecklistChange={onChecklistChange}
    />
  ) : (
    <ScheduleFormView
      key={editingSchedule?.id ?? "new"}
      date={date}
      defaultValues={editingSchedule ? toFormValues(editingSchedule) : undefined}
      onSubmit={handleFormSubmit}
      onCancel={() => setMode(schedules.length > 0 ? "list" : "form")}
      showCancel={schedules.length > 0}
    />
  )
}

interface ScheduleListViewProps {
  schedules: ScheduleFixture[]
  onEdit: (schedule: ScheduleFixture) => void
  onCreate: () => void
  onChecklistChange: (scheduleId: string, checklist: ScheduleChecklistItem[]) => void
}

function ScheduleListView({ schedules, onEdit, onCreate, onChecklistChange }: ScheduleListViewProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
      <Button type="button" size="sm" className="self-start" onClick={onCreate}>
        <Plus />
        일정 추가
      </Button>

      <ul className="flex flex-col gap-3" role="list">
        {schedules.map((schedule) => (
          <li key={schedule.id} className="rounded-lg ring-1 ring-foreground/10 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{schedule.title}</p>
                {schedule.time ? (
                  <p className="text-xs text-muted-foreground">{schedule.time}</p>
                ) : null}
                {schedule.memo ? (
                  <p className="mt-1 text-sm text-muted-foreground">{schedule.memo}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{CATEGORY_LABELS[schedule.category]}</Badge>
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(schedule)}>
                  수정
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-2 text-sm font-medium">체크리스트</p>
              <ChecklistPanel
                items={schedule.checklist ?? []}
                onItemsChange={(checklist) => onChecklistChange(schedule.id, checklist)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ScheduleFormViewProps {
  date: Date
  defaultValues?: ScheduleFormValues
  onSubmit: (values: ScheduleFormValues) => void
  onCancel: () => void
  showCancel: boolean
}

function ScheduleFormView({ date, defaultValues, onSubmit, onCancel, showCancel }: ScheduleFormViewProps) {
  const [reminderEnabled, setReminderEnabled] = useState(!!defaultValues?.reminderTime)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: defaultValues ?? defaultValuesForDate(date),
  })

  function handleSubmit(values: ScheduleFormValues) {
    onSubmit({
      ...values,
      reminderTime: reminderEnabled ? values.reminderTime : undefined,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input placeholder="일정 제목" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea placeholder="메모를 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>날짜</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        <CalendarIcon className="text-muted-foreground" />
                        {field.value
                          ? format(parseISO(field.value), "yyyy.MM.dd", { locale: ko })
                          : "날짜 선택"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(selectedDate) =>
                        selectedDate && field.onChange(format(selectedDate, "yyyy-MM-dd"))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시간</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input px-3 py-2">
              <FormLabel className="font-normal">반복 일정</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 rounded-lg border border-input px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">알림 시각 설정</span>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              aria-label="알림 시각 사용 여부"
            />
          </div>

          {reminderEnabled ? (
            <FormField
              control={form.control}
              name="reminderTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <SheetFooter className="px-0">
          {showCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          ) : null}
          <Button type="submit">{defaultValues ? "수정" : "추가"}</Button>
        </SheetFooter>
      </form>
    </Form>
  )
}

export { ScheduleSheet }
export type { ScheduleSheetProps }
