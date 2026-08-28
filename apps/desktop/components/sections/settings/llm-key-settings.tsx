"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { KeyRound, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { llmApiKeyFormSchema, type LlmApiKeyFormValues } from "@/lib/validators"
import {
  deleteLlmKey,
  fetchLlmKeyStatuses,
  saveLlmKey,
  testLlmKey,
  type LlmKeyStatus,
  type LlmProviderName,
} from "@/lib/llm-keys"
import { formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface ProviderMeta {
  id: LlmProviderName
  label: string
  description: string
}

const PROVIDERS: ProviderMeta[] = [
  { id: "gemini", label: "Gemini", description: "Google Gemini · 무료 티어로 바로 시작할 수 있어요" },
  { id: "anthropic", label: "Anthropic (Claude)", description: "Anthropic Claude · 유료 API 키가 필요해요" },
]

function LlmKeySettings() {
  const [statuses, setStatuses] = useState<LlmKeyStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openProvider, setOpenProvider] = useState<LlmProviderName | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<LlmProviderName | null>(null)

  useEffect(() => {
    loadStatuses()
  }, [])

  async function loadStatuses() {
    setIsLoading(true)
    try {
      setStatuses(await fetchLlmKeyStatuses())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "API 키 등록 현황을 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(provider: LlmProviderName) {
    setDeletingProvider(provider)
    try {
      await deleteLlmKey(provider)
      toast.success("API 키를 삭제했습니다")
      await loadStatuses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "API 키 삭제에 실패했습니다")
    } finally {
      setDeletingProvider(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <KeyRound className="size-4 text-primary" />
          LLM API 키
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          문서 첨삭은 각자 등록한 API 키로 동작합니다. 키는 암호화되어 저장되며 다시 조회할 수 없습니다.
        </p>

        {PROVIDERS.map((provider) => {
          const status = statuses.find((item) => item.provider === provider.id)

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{provider.label}</span>
                  {status ? (
                    <Badge variant="secondary">등록됨 · {formatDate(status.updatedAt)}</Badge>
                  ) : (
                    <Badge variant="outline">미등록</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => setOpenProvider(provider.id)}
                >
                  {status ? "키 변경" : "키 등록"}
                </Button>
                {status ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${provider.label} 키 삭제`}
                    disabled={deletingProvider === provider.id}
                    onClick={() => handleDelete(provider.id)}
                  >
                    {deletingProvider === provider.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 className="text-destructive" />
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          )
        })}
      </CardContent>

      <Dialog open={openProvider !== null} onOpenChange={(open) => !open && setOpenProvider(null)}>
        {openProvider ? (
          <LlmKeyDialog
            provider={openProvider}
            onSaved={() => {
              setOpenProvider(null)
              loadStatuses()
            }}
            onOpenChange={(open) => !open && setOpenProvider(null)}
          />
        ) : null}
      </Dialog>
    </Card>
  )
}

interface LlmKeyDialogProps {
  provider: LlmProviderName
  onSaved: () => void
  onOpenChange: (open: boolean) => void
}

function LlmKeyDialog({ provider, onSaved, onOpenChange }: LlmKeyDialogProps) {
  const meta = PROVIDERS.find((item) => item.id === provider)!
  const [testResult, setTestResult] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<LlmApiKeyFormValues>({
    resolver: zodResolver(llmApiKeyFormSchema),
    defaultValues: { apiKey: "" },
  })

  async function handleTest() {
    const apiKey = form.getValues("apiKey")
    const isValid = await form.trigger("apiKey")
    if (!isValid) return

    setIsTesting(true)
    setTestResult(null)
    try {
      await testLlmKey(provider, apiKey)
      setTestResult({ status: "success", message: "정상적으로 응답했습니다" })
    } catch (error) {
      setTestResult({
        status: "error",
        message: error instanceof Error ? error.message : "키 테스트에 실패했습니다",
      })
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSubmit(values: LlmApiKeyFormValues) {
    setIsSaving(true)
    try {
      await saveLlmKey(provider, values.apiKey)
      toast.success(`${meta.label} API 키를 저장했습니다`)
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "API 키 저장에 실패했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{meta.label} API 키 등록</DialogTitle>
        <DialogDescription>{meta.description}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API 키</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="off"
                    placeholder={provider === "gemini" ? "AIzaSy..." : "sk-ant-..."}
                    {...field}
                    onChange={(event) => {
                      field.onChange(event)
                      setTestResult(null)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {testResult ? (
            <p
              className={
                testResult.status === "success" ? "text-xs text-emerald-600" : "text-xs text-destructive"
              }
            >
              {testResult.message}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || isSaving}>
              {isTesting ? <Loader2 className="animate-spin" /> : null}
              테스트
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : null}
                저장
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export { LlmKeySettings }
