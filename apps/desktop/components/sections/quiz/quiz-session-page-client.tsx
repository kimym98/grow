"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import type { CsQuestion } from "@app/shared"

import { QuizPlayView, type QuestionResponse, type QuestionGradeResult } from "@/components/sections/quiz/quiz-play-view"
import { QuizResultSummary } from "@/components/sections/quiz/quiz-result-summary"
import { MIXED_CATEGORY, MOCK_EXAM_QUESTION_COUNT } from "@/components/sections/quiz/quiz-category"
import { fetchLlmKeyStatuses } from "@/lib/llm-keys"
import {
  completeQuizSession,
  createQuizSession,
  fetchMixedQuestions,
  fetchQuestionsForCategory,
  fetchQuizSessionDetail,
  gradeShortAnswer,
  recordMultipleChoiceAnswer,
  type QuizSessionDetail,
} from "@/lib/quiz"

interface QuizSessionPageClientProps {
  sessionId: string
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "playing"; questions: CsQuestion[]; category: CsQuestion["category"] | typeof MIXED_CATEGORY }
  | { status: "result"; detail: QuizSessionDetail }

function QuizSessionPageClient({ sessionId }: QuizSessionPageClientProps) {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category") as CsQuestion["category"] | typeof MIXED_CATEGORY | null

  const [state, setState] = useState<State>({ status: "loading" })
  const [provider, setProvider] = useState<"gemini" | "anthropic" | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadExistingResult() {
      try {
        const detail = await fetchQuizSessionDetail(sessionId)
        if (!cancelled) {
          if (detail) setState({ status: "result", detail })
          else setState({ status: "error", message: "퀴즈 세션을 찾을 수 없습니다" })
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", message: error instanceof Error ? error.message : "결과를 불러오지 못했습니다" })
        }
      }
    }

    async function startNewSession(category: CsQuestion["category"] | typeof MIXED_CATEGORY) {
      try {
        const questions =
          category === MIXED_CATEGORY
            ? await fetchMixedQuestions(MOCK_EXAM_QUESTION_COUNT)
            : await fetchQuestionsForCategory(category)

        if (questions.length === 0) {
          if (!cancelled) setState({ status: "error", message: "출제 가능한 문제가 없습니다. 잠시 후 다시 시도해주세요." })
          return
        }

        await createQuizSession(sessionId, category, questions.length)

        const statuses = await fetchLlmKeyStatuses()

        if (!cancelled) {
          setProvider(statuses[0]?.provider ?? null)
          setState({ status: "playing", questions, category })
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", message: error instanceof Error ? error.message : "문제를 불러오지 못했습니다" })
        }
      }
    }

    if (categoryParam) void startNewSession(categoryParam)
    else void loadExistingResult()

    return () => {
      cancelled = true
    }
  }, [sessionId, categoryParam])

  async function handleSubmitAnswer(question: CsQuestion, response: QuestionResponse): Promise<QuestionGradeResult> {
    if (question.questionType === "multiple-choice") {
      const selected = response.selected ?? -1
      const isCorrect = selected === question.correctIndex
      await recordMultipleChoiceAnswer(sessionId, question.id, selected, isCorrect)
      return { isCorrect }
    }

    if (!provider) {
      throw new Error("등록된 LLM API 키가 없습니다. 설정에서 키를 먼저 등록해주세요.")
    }

    const result = await gradeShortAnswer(sessionId, question.id, response.answerText ?? "", provider)
    return { isCorrect: result.isCorrect, aiScore: result.score, aiFeedback: result.feedback }
  }

  async function handleComplete() {
    try {
      await completeQuizSession(sessionId)
      const detail = await fetchQuizSessionDetail(sessionId)
      if (detail) {
        setState({ status: "result", detail })
        return
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "결과 저장에 실패했습니다")
    }
    setState({ status: "error", message: "결과를 불러오지 못했습니다" })
  }

  if (state.status === "loading") {
    return <p className="p-6 text-sm text-muted-foreground">불러오는 중입니다...</p>
  }

  if (state.status === "error") {
    return <p className="p-6 text-sm text-destructive">{state.message}</p>
  }

  if (state.status === "result") {
    return (
      <QuizResultSummary
        category={state.detail.session.category}
        questions={state.detail.questions}
        answers={state.detail.answers}
      />
    )
  }

  return (
    <QuizPlayView
      category={state.category}
      questions={state.questions}
      onSubmitAnswer={handleSubmitAnswer}
      onComplete={handleComplete}
    />
  )
}

export { QuizSessionPageClient }
