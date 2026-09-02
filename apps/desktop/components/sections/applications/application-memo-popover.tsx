"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import type { CompanyApplication } from "@app/shared"

import { companyApplicationMemoFormSchema, type CompanyApplicationMemoFormValues } from "@/lib/validators"
import { updateCompanyApplication } from "@/lib/company-applications"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"

interface ApplicationMemoPopoverProps {
  application: CompanyApplication
  onSuccess: (result: CompanyApplication) => void
}

/** 기업명 옆 아이콘을 눌러 그 위치에서 여닫는 메모 편집 팝오버 (오버레이/블러 없음) */
function ApplicationMemoPopover({ application, onSuccess }: ApplicationMemoPopoverProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<CompanyApplicationMemoFormValues>({
    resolver: zodResolver(companyApplicationMemoFormSchema),
    defaultValues: {
      memo: application.memo ?? "",
    },
  })

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({ memo: application.memo ?? "" })
    }
    setOpen(next)
  }

  async function handleSubmit(values: CompanyApplicationMemoFormValues) {
    setIsSaving(true)
    try {
      const result = await updateCompanyApplication(application.id, {
        memo: values.memo.trim() || null,
      })

      toast.success("메모를 저장했습니다")
      onSuccess(result)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "메모 저장에 실패했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label="메모 편집">
          <Pencil className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-2.5">
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="자유롭게 메모를 남겨보세요"
                      className="max-h-64 min-h-24 overflow-y-auto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : null}
                저장
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  )
}

export { ApplicationMemoPopover }
