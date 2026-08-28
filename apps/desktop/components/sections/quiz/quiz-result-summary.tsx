import Link from "next/link"
import type { CsQuestion, UserAnswer } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORY_LABELS, MIXED_CATEGORY, MIXED_LABEL } from "@/components/sections/quiz/quiz-category"

interface QuizResultSummaryProps {
  category: CsQuestion["category"] | typeof MIXED_CATEGORY
  questions: CsQuestion[]
  answers: UserAnswer[]
}

function QuizResultSummary({ category, questions, answers }: QuizResultSummaryProps) {
  const categoryLabel = category === MIXED_CATEGORY ? MIXED_LABEL : CATEGORY_LABELS[category]
  const correctCount = answers.filter((answer) => answer.isCorrect).length
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0
  const wrongAnswers = answers.filter((answer) => !answer.isCorrect)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Badge variant="outline">{categoryLabel}</Badge>
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
                  {question.questionType === "multiple-choice" ? (
                    <>
                      <p className="text-red-600 dark:text-red-400">
                        선택한 답: {answer.selected !== undefined ? question.choices[answer.selected] : "미응답"}
                      </p>
                      <p className="text-green-600 dark:text-green-400">
                        정답: {question.choices[question.correctIndex]}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">제출한 답변: {answer.answerText}</p>
                      {typeof answer.aiScore === "number" && (
                        <p className="text-red-600 dark:text-red-400">AI 채점 점수: {answer.aiScore}점</p>
                      )}
                      {answer.aiFeedback && <p className="text-muted-foreground">AI 피드백: {answer.aiFeedback}</p>}
                    </>
                  )}
                  <p className="text-muted-foreground">모범 답안: {question.answer}</p>
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
