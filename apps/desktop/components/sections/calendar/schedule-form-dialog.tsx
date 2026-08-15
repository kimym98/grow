"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { scheduleFormSchema, type ScheduleFormValues } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORY_LABELS } from "@/components/sections/calendar/schedule-category"

const DEFAULT_VALUES: ScheduleFormValues = {
  title: "",
  memo: "",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "",
  reminderTime: "",
  isRecurring: false,
  category: "etc",
}

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: ScheduleFormValues
  onSubmit: (values: ScheduleFormValues) => void
}

function ScheduleFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: ScheduleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ScheduleFormDialogBody
          key={defaultValues?.title ?? "new"}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  )
}

interface ScheduleFormDialogBodyProps {
  defaultValues?: ScheduleFormValues
  onSubmit: (values: ScheduleFormValues) => void
  onOpenChange: (open: boolean) => void
}

function ScheduleFormDialogBody({
  defaultValues,
  onSubmit,
  onOpenChange,
}: ScheduleFormDialogBodyProps) {
  const [reminderEnabled, setReminderEnabled] = useState(
    !!defaultValues?.reminderTime
  )

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  })

  function handleSubmit(values: ScheduleFormValues) {
    onSubmit({
      ...values,
      reminderTime: reminderEnabled ? values.reminderTime : undefined,
    })
    onOpenChange(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{defaultValues ? "일정 수정" : "일정 추가"}</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
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
                        onSelect={(date) =>
                          date && field.onChange(format(date, "yyyy-MM-dd"))
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">{defaultValues ? "수정" : "추가"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export { ScheduleFormDialog }
