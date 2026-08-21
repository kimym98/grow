import type { CsQuestionFixture } from "@app/shared"

export const CATEGORY_LABELS: Record<CsQuestionFixture["category"], string> = {
  network: "네트워크",
  database: "데이터베이스",
  os: "운영체제",
  "data-structure": "자료구조",
}

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as CsQuestionFixture["category"][]
