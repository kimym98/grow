"use client"

import { useRouter } from "next/navigation"
import { Database, HardDrive, Network, Workflow } from "lucide-react"
import type { CsQuestionFixture } from "@app/shared"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORY_LABELS, CATEGORIES } from "@/components/sections/quiz/quiz-category"

const CATEGORY_ICONS: Record<CsQuestionFixture["category"], typeof Network> = {
  network: Network,
  database: Database,
  os: HardDrive,
  "data-structure": Workflow,
}

function QuizCategorySelect() {
  const router = useRouter()

  function handleSelect(category: CsQuestionFixture["category"]) {
    const sessionId = `session-${crypto.randomUUID()}`
    router.push(`/quiz/${sessionId}?category=${category}`)
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
      </div>
    </div>
  )
}

export { QuizCategorySelect }
