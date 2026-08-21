"use client"

import { useMemo } from "react"
import { createQuizSessionFixtures } from "@app/shared"

import { QuizCategorySelect } from "@/components/sections/quiz/quiz-category-select"
import { QuizSessionList } from "@/components/sections/quiz/quiz-session-list"

function QuizPageClient() {
  const sessions = useMemo(() => createQuizSessionFixtures(5), [])

  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold">CS 면접 퀴즈</h1>
      <QuizCategorySelect />
      <QuizSessionList sessions={sessions} />
    </div>
  )
}

export { QuizPageClient }
