"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { CoverLetterQuestion } from "@app/shared"

import { coverLetterQuestionFormSchema, type CoverLetterQuestionFormValues } from "@/lib/validators"
import { createCoverLetterQuestion } from "@/lib/cover-letter-questions"
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
import { Textarea } from "@/components/ui/textarea"

interface CoverLetterQuestionFormDialogProps {
  applicationId: string
  onOpenChange: (open: boolean) => void
  onSuccess: (result: CoverLetterQuestion) => void
}

/** 자소서 문항 추가 다이얼로그 (RHF + zodResolver + shadcn Dialog 조합, application-form-dialog.tsx 패턴 참고) */
function CoverLetterQuestionFormDialog({
  applicationId,
  onOpenChange,
  onSuccess,
}: CoverLetterQuestionFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<CoverLetterQuestionFormValues>({
    resolver: zodResolver(coverLetterQuestionFormSchema),
    defaultValues: {
      questionText: "",
      charLimit: "",
    },
  })

  async function handleSubmit(values: CoverLetterQuestionFormValues) {
    setIsSaving(true)
    try {
      const charLimit = values.charLimit ? Number(values.charLimit) : null

      const result = await createCoverLetterQuestion(applicationId, {
        questionText: values.questionText,
        charLimit: charLimit && !Number.isNaN(charLimit) ? charLimit : null,
      })

      toast.success("문항을 추가했습니다")
      onSuccess(result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "문항 추가에 실패했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>자소서 문항 추가</DialogTitle>
        <DialogDescription>답변할 자소서 문항과 글자수 제한을 입력해주세요</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="questionText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>문항</FormLabel>
                <FormControl>
                  <Textarea placeholder="예: 지원 동기를 작성해주세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="charLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>글자수 제한 (선택)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="예: 500" {...field} />
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
              추가
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export { CoverLetterQuestionFormDialog }
