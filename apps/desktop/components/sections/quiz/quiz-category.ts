import type { CsQuestion } from "@app/shared"

export const CATEGORY_LABELS: Record<CsQuestion["category"], string> = {
  network: "네트워크",
  database: "데이터베이스",
  os: "운영체제",
  "data-structure": "자료구조",
  "ai-llm": "AI/LLM",
  frontend: "프론트엔드",
}

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as CsQuestion["category"][]

/** 전체 카테고리를 아우르는 모의고사(종합 시험) 모드의 세션 카테고리 값 */
export const MIXED_CATEGORY = "mixed" as const

export const MIXED_LABEL = "종합 모의고사"

export const MOCK_EXAM_QUESTION_COUNT = 20
