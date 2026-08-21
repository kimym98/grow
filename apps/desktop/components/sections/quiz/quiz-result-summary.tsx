import Link from "next/link"
import type { CsQuestionFixture, QuizAnswerFixture } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORY_LABELS } from "@/components/sections/quiz/quiz-category"

interface QuizResultSummaryProps {
  category: CsQuestionFixture["category"]
  questions: CsQuestionFixture[]
  answers: QuizAnswerFixture[]
}

function QuizResultSummary({ category, questions, answers }: QuizResultSummaryProps) {
  const correctCount = answers.filter((answer) => answer.isCorrect).length
  const accuracy = Math.round((correctCount / answers.length) * 100)
  const wrongAnswers = answers.filter((answer) => !answer.isCorrect)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Badge variant="outline">{CATEGORY_LABELS[category]}</Badge>
        <h1 className="text-2xl font-semibold">결과 요약</h1>
        <p className="text-sm text-muted-foreground">
          {answers.length}문제 중 {correctCount}문제 정답 · 정답률 {accuracy}%
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">오답노트</h2>
        {wrongAnswers.length === 0 ? (
          <p className="text-sm text-muted-foreground">모든 문제를 맞혔습니다.</p>
        ) : (
          wrongAnswers.map((answer) => {
            const question = questions.find((item) => item.id === answer.questionId)
            if (!question) return null

            return (
              <Card key={answer.questionId} size="sm">
                <CardHeader>
                  <CardTitle className="text-sm">{question.question}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm">
                  <p className="text-red-600 dark:text-red-400">
                    선택한 답: {question.choices[answer.selected]}
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    정답: {question.choices[question.correctIndex]}
                  </p>
                  <p className="text-muted-foreground">{question.answer}</p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Button asChild variant="outline" className="self-start">
        <Link href="/quiz">퀴즈 목록으로</Link>
      </Button>
    </div>
  )
}

export { QuizResultSummary }
