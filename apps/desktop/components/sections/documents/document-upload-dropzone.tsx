"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { UploadCloud } from "lucide-react"

import { documentFileSchema } from "@/lib/document-upload"
import type { LlmProviderName } from "@/lib/llm-keys"
import { documentUploadFormSchema, type DocumentUploadFormValues } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PROVIDER_LABELS: Record<LlmProviderName, string> = {
  gemini: "Gemini",
  anthropic: "Anthropic (Claude)",
}

interface DocumentUploadDropzoneProps {
  availableProviders: LlmProviderName[]
  onSubmit: (file: File, values: DocumentUploadFormValues) => void
  onOpenChange: (open: boolean) => void
}

function DocumentUploadDropzone({ availableProviders, onSubmit, onOpenChange }: DocumentUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadFormSchema),
    defaultValues: {
      fileName: "",
      type: "resume",
      provider: availableProviders[0],
    },
  })

  function handleFile(selected?: File) {
    if (!selected) return

    const result = documentFileSchema.safeParse(selected)
    if (!result.success) {
      setFileError(result.error.issues[0]?.message ?? "올바르지 않은 파일입니다")
      return
    }

    setFileError(null)
    setFile(selected)
    form.setValue("fileName", selected.name, { shouldValidate: true })
  }

  function handleSubmit(values: DocumentUploadFormValues) {
    if (!file) {
      setFileError("파일을 선택해주세요")
      return
    }

    onSubmit(file, values)
    onOpenChange(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>문서 업로드</DialogTitle>
        <DialogDescription>PDF 파일을 업로드하면 등록한 AI 키로 첨삭을 시작합니다</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="fileName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>파일</FormLabel>
                <FormControl>
                  <label
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDragOver(true)
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(event) => {
                      event.preventDefault()
                      setIsDragOver(false)
                      handleFile(event.dataTransfer.files?.[0])
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input p-6 text-center transition-colors",
                      isDragOver ? "border-primary bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <UploadCloud className="size-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {field.value || "파일을 드래그하거나 클릭해서 선택하세요"}
                    </p>
                    <Input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(event) => handleFile(event.target.files?.[0])}
                    />
                  </label>
                </FormControl>
                {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>첨삭에 사용할 AI</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="AI 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {PROVIDER_LABELS[provider]}
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>문서 유형</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="문서 유형 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="resume">이력서</SelectItem>
                    <SelectItem value="portfolio">포트폴리오</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">업로드</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export { DocumentUploadDropzone }
