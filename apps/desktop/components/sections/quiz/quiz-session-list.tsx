"use client"

import Link from "next/link"
import type { QuizSession } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { CATEGORY_LABELS, MIXED_CATEGORY, MIXED_LABEL } from "@/components/sections/quiz/quiz-category"

interface QuizSessionListProps {
  sessions: QuizSession[]
  wrongAnswerCount: number
}

function QuizSessionList({ sessions, wrongAnswerCount }: QuizSessionListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">결과 요약 · 오답노트</h2>
        <Badge variant="outline">오답 {wrongAnswerCount}개</Badge>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="풀이한 퀴즈가 없습니다" description="카테고리를 선택해 첫 퀴즈를 풀어보세요" />
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => {
            const accuracy =
              session.totalCount > 0 ? Math.round((session.correctCount / session.totalCount) * 100) : 0
            const categoryLabel = session.category === MIXED_CATEGORY ? MIXED_LABEL : CATEGORY_LABELS[session.category]

            return (
              <li key={session.id}>
                <Link href={`/quiz?session=${session.id}`}>
                  <Card className="transition-colors hover:bg-muted focus-visible:bg-muted">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{categoryLabel}</p>
                        <p className="text-xs text-muted-foreground">{session.createdAt.slice(0, 10)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={accuracy >= 60 ? "default" : "destructive"}>정답률 {accuracy}%</Badge>
                        <Badge variant="outline">
                          {session.correctCount}/{session.totalCount}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { QuizSessionList }
