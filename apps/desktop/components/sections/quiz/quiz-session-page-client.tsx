"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  createCsQuestionFixtures,
  createQuizSessionFixtures,
  type CsQuestionFixture,
  type QuizAnswerFixture,
} from "@app/shared"

import { QuizPlayView } from "@/components/sections/quiz/quiz-play-view"
import { QuizResultSummary } from "@/components/sections/quiz/quiz-result-summary"

const QUESTIONS_PER_SESSION = 5

interface QuizSessionPageClientProps {
  sessionId: string
}

function QuizSessionPageClient({ sessionId }: QuizSessionPageClientProps) {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category") as CsQuestionFixture["category"] | null

  const allQuestions = useMemo(() => createCsQuestionFixtures(20), [])
  const existingSessions = useMemo(() => createQuizSessionFixtures(5), [])
  const existingSession = existingSessions.find((session) => session.id === sessionId)

  const [completedAnswers, setCompletedAnswers] = useState<QuizAnswerFixture[] | null>(null)

  const category = categoryParam ?? existingSession?.category ?? "network"
  const categoryQuestions = useMemo(
    () => allQuestions.filter((question) => question.category === category).slice(0, QUESTIONS_PER_SESSION),
    [allQuestions, category]
  )

  if (existingSession) {
    return (
      <QuizResultSummary category={existingSession.category} questions={allQuestions} answers={existingSession.answers} />
    )
  }

  if (completedAnswers) {
    return <QuizResultSummary category={category} questions={allQuestions} answers={completedAnswers} />
  }

  return (
    <QuizPlayView category={category} questions={categoryQuestions} onComplete={setCompletedAnswers} />
  )
}

export { QuizSessionPageClient }
