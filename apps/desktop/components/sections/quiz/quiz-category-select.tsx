"use client"

import { useRouter } from "next/navigation"
import { Bot, Database, HardDrive, Layout, Network, Trophy, Workflow } from "lucide-react"
import type { CsQuestion } from "@app/shared"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CATEGORIES,
  CATEGORY_LABELS,
  MIXED_CATEGORY,
  MIXED_LABEL,
  MOCK_EXAM_QUESTION_COUNT,
} from "@/components/sections/quiz/quiz-category"

const CATEGORY_ICONS: Record<CsQuestion["category"], typeof Network> = {
  network: Network,
  database: Database,
  os: HardDrive,
  "data-structure": Workflow,
  "ai-llm": Bot,
  frontend: Layout,
}

function QuizCategorySelect() {
  const router = useRouter()

  function handleSelect(category: CsQuestion["category"] | typeof MIXED_CATEGORY) {
    // quiz_sessions.id는 uuid 컬럼이므로 접두사 없는 순수 uuid를 사용해야 세션 생성이 가능하다
    const sessionId = crypto.randomUUID()
    router.push(`/quiz?session=${sessionId}&category=${category}`)
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">카테고리 선택</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category]

          return (
            <button key={category} type="button" onClick={() => handleSelect(category)} className="text-left">
              <Card className="transition-colors hover:bg-muted focus-visible:bg-muted">
                <CardHeader>
                  <Icon className="size-5 text-muted-foreground" />
                  <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">문제 풀이 시작하기</p>
                </CardContent>
              </Card>
            </button>
          )
        })}

        <button type="button" onClick={() => handleSelect(MIXED_CATEGORY)} className="text-left">
          <Card className="border-primary/50 transition-colors hover:bg-muted focus-visible:bg-muted">
            <CardHeader>
              <Trophy className="size-5 text-primary" />
              <CardTitle>{MIXED_LABEL}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">전체 카테고리 {MOCK_EXAM_QUESTION_COUNT}문항 무작위 출제</p>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  )
}

export { QuizCategorySelect }
