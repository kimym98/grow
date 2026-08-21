import type { DocumentReviewFixture } from "@app/shared"

import { Badge } from "@/components/ui/badge"

const STATUS_LABELS: Record<DocumentReviewFixture["status"], string> = {
  pending: "대기중",
  processing: "처리중",
  completed: "완료",
  failed: "실패",
}

const STATUS_VARIANTS: Record<
  DocumentReviewFixture["status"],
  "outline" | "secondary" | "default" | "destructive"
> = {
  pending: "outline",
  processing: "secondary",
  completed: "default",
  failed: "destructive",
}

interface DocumentStatusBadgeProps {
  status: DocumentReviewFixture["status"]
}

function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
}

export { DocumentStatusBadge, STATUS_LABELS }
