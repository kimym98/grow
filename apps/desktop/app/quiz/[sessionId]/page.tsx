interface QuizSessionPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function QuizSessionPage({
  params,
}: QuizSessionPageProps) {
  const { sessionId } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">퀴즈 세션: {sessionId}</h1>
      <p className="text-muted-foreground mt-2">
        문제 풀이 화면이 여기에 표시됩니다.
      </p>
    </div>
  )
}
