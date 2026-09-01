import type { CompanyApplicationStatus } from "@app/shared"

import { Badge } from "@/components/ui/badge"

/** 상태 → 기존 Badge variant 매핑 (신규 CVA variant 추가 없이 default/secondary/outline/destructive만 사용) */
const STATUS_BADGE_VARIANT: Record<CompanyApplicationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  준비중: "outline",
  서류제출: "secondary",
  서류합격: "secondary",
  테스트: "secondary",
  면접: "secondary",
  최종합격: "default",
  탈락: "destructive",
}

function ApplicationStatusBadge({ status }: { status: CompanyApplicationStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{status}</Badge>
}

export { ApplicationStatusBadge, STATUS_BADGE_VARIANT }
