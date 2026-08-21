import { Suspense } from "react"

import { QuizSessionPageClient } from "@/components/sections/quiz/quiz-session-page-client"

interface QuizSessionPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function QuizSessionPage({
  params,
}: QuizSessionPageProps) {
  const { sessionId } = await params

  return (
    <Suspense fallback={null}>
      <QuizSessionPageClient sessionId={sessionId} />
    </Suspense>
  )
}
