"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { CompanyApplication } from "@app/shared"

import { companyApplicationFormSchema, type CompanyApplicationFormValues } from "@/lib/validators"
import { createCompanyApplication, updateCompanyApplication } from "@/lib/company-applications"
import { STATUS_OPTIONS } from "@/components/sections/applications/application-filters"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface ApplicationFormDialogProps {
  mode: "create" | "edit"
  initialValues?: CompanyApplication
  onOpenChange: (open: boolean) => void
  onSuccess: (result: CompanyApplication) => void
}

/** 지원 기업 등록/수정 다이얼로그 (RHF + zodResolver + shadcn Dialog 조합, llm-key-settings.tsx 패턴 참고) */
function ApplicationFormDialog({ mode, initialValues, onOpenChange, onSuccess }: ApplicationFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<CompanyApplicationFormValues>({
    resolver: zodResolver(companyApplicationFormSchema),
    defaultValues: {
      companyName: initialValues?.companyName ?? "",
      position: initialValues?.position ?? "",
      applyUrl: initialValues?.applyUrl ?? "",
      appliedAt: initialValues?.appliedAt ?? "",
      status: initialValues?.status ?? "준비중",
      memo: initialValues?.memo ?? "",
    },
  })

  async function handleSubmit(values: CompanyApplicationFormValues) {
    setIsSaving(true)
    try {
      const payload = {
        companyName: values.companyName,
        position: values.position || null,
        applyUrl: values.applyUrl || null,
        appliedAt: values.appliedAt || null,
        status: values.status,
        memo: values.memo || null,
        sourceJobPostingId: initialValues?.sourceJobPostingId ?? null,
      }

      const result =
        mode === "create"
          ? await createCompanyApplication(payload)
          : await updateCompanyApplication(initialValues!.id, payload)

      toast.success(mode === "create" ? "지원 기업을 등록했습니다" : "지원 기업 정보를 수정했습니다")
      onSuccess(result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "새 지원 기업 등록" : "지원 기업 정보 수정"}</DialogTitle>
        <DialogDescription>지원한 기업의 정보를 입력해주세요</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>기업명</FormLabel>
                <FormControl>
                  <Input placeholder="예: 그로우" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>직무</FormLabel>
                <FormControl>
                  <Input placeholder="예: 프론트엔드 개발자" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applyUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>지원 링크</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appliedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>지원일</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상태</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
            name="memo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메모</FormLabel>
                <FormControl>
                  <Textarea placeholder="메모를 입력해주세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              저장
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export { ApplicationFormDialog }
