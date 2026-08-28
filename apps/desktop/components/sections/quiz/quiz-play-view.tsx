"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CsQuestion } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORY_LABELS, MIXED_CATEGORY, MIXED_LABEL } from "@/components/sections/quiz/quiz-category"

export interface QuestionResponse {
  selected?: number
  answerText?: string
}

export interface QuestionGradeResult {
  isCorrect: boolean
  aiScore?: number
  aiFeedback?: string
}

interface QuizPlayViewProps {
  category: CsQuestion["category"] | typeof MIXED_CATEGORY
  questions: CsQuestion[]
  onSubmitAnswer: (question: CsQuestion, response: QuestionResponse) => Promise<QuestionGradeResult>
  onComplete: () => void
}

type Phase = "answering" | "grading" | "feedback"

function QuizPlayView({ category, questions, onSubmitAnswer, onComplete }: QuizPlayViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [phase, setPhase] = useState<Phase>("answering")
  const [result, setResult] = useState<QuestionGradeResult | null>(null)

  const currentQuestion = questions[currentIndex]
  const progress = Math.round((currentIndex / questions.length) * 100)
  const isLastQuestion = currentIndex === questions.length - 1
  const categoryLabel = category === MIXED_CATEGORY ? MIXED_LABEL : CATEGORY_LABELS[category]

  const canSubmit =
    currentQuestion.questionType === "multiple-choice" ? selected !== null : answerText.trim().length > 0

  async function handleSubmit() {
    if (!canSubmit) return

    setPhase("grading")

    try {
      const response: QuestionResponse =
        currentQuestion.questionType === "multiple-choice"
          ? { selected: selected ?? undefined }
          : { answerText }

      const gradeResult = await onSubmitAnswer(currentQuestion, response)
      setResult(gradeResult)
      setPhase("feedback")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "채점 중 오류가 발생했습니다")
      setPhase("answering")
    }
  }

  function handleNext() {
    if (isLastQuestion) {
      onComplete()
      return
    }

    setCurrentIndex((index) => index + 1)
    setSelected(null)
    setAnswerText("")
    setResult(null)
    setPhase("answering")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{categoryLabel}</Badge>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-medium">{currentQuestion.question}</h1>

        {currentQuestion.questionType === "multiple-choice" ? (
          <RadioGroup
            value={selected === null ? undefined : String(selected)}
            onValueChange={(value) => setSelected(Number(value))}
            disabled={phase !== "answering"}
          >
            {currentQuestion.choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border border-input px-3 py-2">
                <RadioGroupItem value={String(index)} id={`choice-${index}`} />
                <Label htmlFor={`choice-${index}`} className="flex-1 font-normal">
                  {choice}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Textarea
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            disabled={phase !== "answering"}
            placeholder="답변을 서술해주세요"
            className="min-h-32"
          />
        )}

        {phase === "feedback" && result && (
          <div
            className={
              result.isCorrect
                ? "rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm text-green-700 dark:text-green-400"
                : "rounded-lg border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-700 dark:text-red-400"
            }
          >
            <p className="font-medium">{result.isCorrect ? "정답입니다" : "오답입니다"}</p>
            {typeof result.aiScore === "number" && <p>AI 채점 점수: {result.aiScore}점</p>}
            {result.aiFeedback && <p className="mt-1 text-muted-foreground">{result.aiFeedback}</p>}
            {currentQuestion.questionType === "multiple-choice" && !result.isCorrect && (
              <p className="mt-1 text-muted-foreground">정답: {currentQuestion.choices[currentQuestion.correctIndex]}</p>
            )}
          </div>
        )}
      </div>

      {phase === "feedback" ? (
        <Button onClick={handleNext} className="self-end">
          {isLastQuestion ? "완료" : "다음"}
        </Button>
      ) : (
        <Button onClick={handleSubmit} disabled={!canSubmit || phase === "grading"} className="self-end">
          {phase === "grading" ? "채점 중..." : "제출"}
        </Button>
      )}
    </div>
  )
}

export { QuizPlayView }
