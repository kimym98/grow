"use client"

import { useState } from "react"
import type { CsQuestionFixture, QuizAnswerFixture } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CATEGORY_LABELS } from "@/components/sections/quiz/quiz-category"

interface QuizPlayViewProps {
  category: CsQuestionFixture["category"]
  questions: CsQuestionFixture[]
  onComplete: (answers: QuizAnswerFixture[]) => void
}

function QuizPlayView({ category, questions, onComplete }: QuizPlayViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<QuizAnswerFixture[]>([])

  const currentQuestion = questions[currentIndex]
  const progress = Math.round((currentIndex / questions.length) * 100)
  const isLastQuestion = currentIndex === questions.length - 1

  function handleNext() {
    if (selected === null) return

    const answer: QuizAnswerFixture = {
      questionId: currentQuestion.id,
      selected,
      isCorrect: selected === currentQuestion.correctIndex,
    }
    const nextAnswers = [...answers, answer]

    if (isLastQuestion) {
      onComplete(nextAnswers)
      return
    }

    setAnswers(nextAnswers)
    setSelected(null)
    setCurrentIndex((index) => index + 1)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{CATEGORY_LABELS[category]}</Badge>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-medium">{currentQuestion.question}</h1>

        <RadioGroup
          value={selected === null ? undefined : String(selected)}
          onValueChange={(value) => setSelected(Number(value))}
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
      </div>

      <Button onClick={handleNext} disabled={selected === null} className="self-end">
        {isLastQuestion ? "제출" : "다음"}
      </Button>
    </div>
  )
}

export { QuizPlayView }
