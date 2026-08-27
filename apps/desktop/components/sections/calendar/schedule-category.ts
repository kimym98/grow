import type { Schedule } from "@app/shared"

export const CATEGORY_LABELS: Record<Schedule["category"], string> = {
  interview: "면접",
  deadline: "마감",
  study: "스터디",
  etc: "기타",
}
