"use client"

import { useEffect, useState } from "react"
import type { QuizSession } from "@app/shared"

import { QuizCategorySelect } from "@/components/sections/quiz/quiz-category-select"
import { QuizSessionList } from "@/components/sections/quiz/quiz-session-list"
import { fetchQuizSessions, fetchWrongAnswerCount } from "@/lib/quiz"

function QuizPageClient() {
  const [sessions, setSessions] = useState<QuizSession[]>([])
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0)

  useEffect(() => {
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
  }, [])

  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold">CS 면접 퀴즈</h1>
      <QuizCategorySelect />
      <QuizSessionList sessions={sessions} wrongAnswerCount={wrongAnswerCount} />
    </div>
  )
}

export { QuizPageClient }
