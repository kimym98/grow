import { Suspense } from "react"

import { QuizPageClient } from "@/components/sections/quiz/quiz-page-client"

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <QuizPageClient />
    </Suspense>
  )
}
