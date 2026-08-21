"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { UploadCloud } from "lucide-react"

import { documentUploadFormSchema, type DocumentUploadFormValues } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import {
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const DEFAULT_VALUES: DocumentUploadFormValues = {
  fileName: "",
  type: "resume",
  resumeQuestion: "",
}

interface DocumentUploadDropzoneProps {
  onSubmit: (values: DocumentUploadFormValues) => void
  onOpenChange: (open: boolean) => void
}

function DocumentUploadDropzone({ onSubmit, onOpenChange }: DocumentUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const type = form.watch("type")

  function handleFile(file?: File) {
    if (file) {
      form.setValue("fileName", file.name, { shouldValidate: true })
    }
  }

  function handleSubmit(values: DocumentUploadFormValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>문서 업로드</DialogTitle>
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
                    <SelectItem value="resume">자소서 (문항별)</SelectItem>
                    <SelectItem value="portfolio">포트폴리오</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "resume" ? (
            <FormField
              control={form.control}
              name="resumeQuestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>자소서 문항</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 지원 동기를 서술하시오" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

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
