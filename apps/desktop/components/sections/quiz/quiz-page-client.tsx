"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { QuizSession } from "@app/shared"

import { QuizCategorySelect } from "@/components/sections/quiz/quiz-category-select"
import { QuizSessionList } from "@/components/sections/quiz/quiz-session-list"
import { QuizSessionPageClient } from "@/components/sections/quiz/quiz-session-page-client"
import { fetchQuizSessions, fetchWrongAnswerCount } from "@/lib/quiz"

function QuizPageClient() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  const [sessions, setSessions] = useState<QuizSession[]>([])
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0)

  useEffect(() => {
    if (sessionId) return

    let cancelled = false

    async function load() {
      try {
        const [sessionList, wrongCount] = await Promise.all([fetchQuizSessions(), fetchWrongAnswerCount()])
        if (!cancelled) {
          setSessions(sessionList)
          setWrongAnswerCount(wrongCount)
        }
      } catch {
        // 목록 조회 실패는 빈 목록으로 조용히 대체한다 (카테고리 선택 기능은 계속 사용 가능해야 함)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (sessionId) {
    return <QuizSessionPageClient sessionId={sessionId} />
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold">CS 면접 퀴즈</h1>
      <QuizCategorySelect />
      <QuizSessionList sessions={sessions} wrongAnswerCount={wrongAnswerCount} />
    </div>
  )
}

export { QuizPageClient }
