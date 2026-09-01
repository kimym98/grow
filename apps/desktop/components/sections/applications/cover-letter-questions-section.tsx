"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { CompanyAnalysisStatus, CoverLetterQuestion } from "@app/shared"

import {
  deleteCoverLetterQuestion,
  fetchCoverLetterQuestions,
  requestCoverLetterQuestionFeedback,
  updateCoverLetterQuestion,
} from "@/lib/cover-letter-questions"
import type { LlmProviderName } from "@/lib/llm-keys"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CoverLetterQuestionFormDialog } from "@/components/sections/applications/cover-letter-question-form-dialog"

const FEEDBACK_POLL_INTERVAL_MS = 4000

interface CoverLetterQuestionsSectionProps {
  applicationId: string
  companyAnalysisStatus: CompanyAnalysisStatus | null
  feedbackProvider: LlmProviderName | null
}

interface QuestionCardProps {
  question: CoverLetterQuestion
  companyAnalysisStatus: CompanyAnalysisStatus | null
  feedbackProvider: LlmProviderName | null
  onUpdated: (result: CoverLetterQuestion) => void
  onDeleted: (id: string) => void
}

/** 문항 1건의 인라인 답변 에디터 카드 (실시간 글자수 카운터 + 제한 초과 경고 + 명시적 저장 버튼 + AI 첨삭) */
function QuestionCard({
  question,
  companyAnalysisStatus,
  feedbackProvider,
  onUpdated,
  onDeleted,
}: QuestionCardProps) {
  const [answerText, setAnswerText] = useState(question.answerText ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false)
  const feedbackPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const charCount = answerText.length
  const isOverLimit = question.charLimit != null && charCount > question.charLimit

  async function handleSave() {
    setIsSaving(true)
    try {
      const result = await updateCoverLetterQuestion(question.id, { answerText })
      onUpdated(result)
      toast.success("답변을 저장했습니다")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "답변 저장에 실패했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  async function loadFeedback() {
    try {
      const questions = await fetchCoverLetterQuestions(question.applicationId)
      const latest = questions.find((item) => item.id === question.id)
      if (latest) onUpdated(latest)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "첨삭 결과를 불러오지 못했습니다")
    }
  }

  // 첨삭이 진행 중일 때만 완료/실패로 바뀔 때까지 주기적으로 다시 조회한다
  useEffect(() => {
    const isInFlight = question.feedbackStatus === "processing"

    if (isInFlight && !feedbackPollTimerRef.current) {
      feedbackPollTimerRef.current = setInterval(loadFeedback, FEEDBACK_POLL_INTERVAL_MS)
    } else if (!isInFlight && feedbackPollTimerRef.current) {
      clearInterval(feedbackPollTimerRef.current)
      feedbackPollTimerRef.current = null
    }

    return () => {
      if (feedbackPollTimerRef.current) {
        clearInterval(feedbackPollTimerRef.current)
        feedbackPollTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.feedbackStatus])

  async function handleRequestFeedback() {
    if (!feedbackProvider) {
      toast.error("먼저 설정에서 LLM API 키를 등록해주세요")
      return
    }

    setIsRequestingFeedback(true)
    try {
      await requestCoverLetterQuestionFeedback(question.id, feedbackProvider)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 첨삭 요청에 실패했습니다")
    } finally {
      await loadFeedback()
      setIsRequestingFeedback(false)
    }
  }

  const isFeedbackDisabled =
    !answerText.trim() ||
    companyAnalysisStatus !== "completed" ||
    question.feedbackStatus === "processing" ||
    isRequestingFeedback

  async function handleDelete() {
    if (!window.confirm("이 문항을 삭제하시겠습니까?")) return

    setIsDeleting(true)
    try {
      await deleteCoverLetterQuestion(question.id)
      toast.success("문항을 삭제했습니다")
      onDeleted(question.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "문항 삭제에 실패했습니다")
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm font-medium leading-relaxed">{question.questionText}</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          삭제
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Textarea
          value={answerText}
          onChange={(event) => setAnswerText(event.target.value)}
          placeholder="답변을 작성해주세요"
          className="min-h-32"
        />
        <div className="flex items-center justify-between">
          <span className={cn("text-xs text-muted-foreground", isOverLimit && "font-medium text-destructive")}>
            {charCount}
            {question.charLimit != null ? ` / ${question.charLimit}자` : "자"}
            {isOverLimit ? " · 글자수 제한을 초과했습니다" : ""}
          </span>
          <Button type="button" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            저장
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">AI 기업 맞춤 첨삭</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRequestFeedback}
              disabled={isFeedbackDisabled}
            >
              {isRequestingFeedback || question.feedbackStatus === "processing" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              AI 첨삭 받기
            </Button>
          </div>

          {companyAnalysisStatus !== "completed" ? (
            <p className="text-xs text-muted-foreground">
              기업 분석이 완료되어야 첨삭을 받을 수 있습니다. 먼저 기업 분석을 완료해주세요.
            </p>
          ) : null}

          {question.feedbackStatus === "processing" ? (
            <p className="text-xs text-muted-foreground">AI가 답변을 첨삭하고 있습니다...</p>
          ) : null}

          {question.feedbackStatus === "completed" && question.feedbackText ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">{question.feedbackText}</p>
          ) : null}

          {question.feedbackStatus === "failed" ? (
            <p className="text-xs text-destructive">
              첨삭에 실패했습니다{question.feedbackErrorMessage ? `: ${question.feedbackErrorMessage}` : ""}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

/** 지원 기업 상세의 자소서 문항 목록 섹션 (문항 추가 + 문항별 인라인 답변 작성/저장/삭제) */
function CoverLetterQuestionsSection({
  applicationId,
  companyAnalysisStatus,
  feedbackProvider,
}: CoverLetterQuestionsSectionProps) {
  const [questions, setQuestions] = useState<CoverLetterQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

  useEffect(() => {
    let isCancelled = false

    fetchCoverLetterQuestions(applicationId)
      .then((result) => {
        if (!isCancelled) setQuestions(result)
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "자소서 문항을 불러오지 못했습니다")
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [applicationId])

  function handleUpdated(result: CoverLetterQuestion) {
    setQuestions((prev) => prev.map((question) => (question.id === result.id ? result : question)))
  }

  function handleDeleted(id: string) {
    setQuestions((prev) => prev.filter((question) => question.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>자소서 문항</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 자소서 문항이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                companyAnalysisStatus={companyAnalysisStatus}
                feedbackProvider={feedbackProvider}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}

        <Button type="button" variant="outline" className="self-start" onClick={() => setIsAddOpen(true)}>
          문항 추가
        </Button>
      </CardContent>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        {isAddOpen ? (
          <CoverLetterQuestionFormDialog
            applicationId={applicationId}
            onOpenChange={setIsAddOpen}
            onSuccess={(result) => {
              setIsAddOpen(false)
              setQuestions((prev) => [...prev, result])
            }}
          />
        ) : null}
      </Dialog>
    </Card>
  )
}

export { CoverLetterQuestionsSection }
