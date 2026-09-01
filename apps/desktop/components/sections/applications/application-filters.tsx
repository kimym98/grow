import { ChevronDown } from "lucide-react"
import type { CompanyApplicationStatus } from "@app/shared"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** 지원 기업 상태값 전체 (동적 추출 없이 고정 배열로 항상 노출) */
const STATUS_OPTIONS: CompanyApplicationStatus[] = [
  "준비중",
  "서류제출",
  "서류합격",
  "테스트",
  "면접",
  "최종합격",
  "탈락",
]

const selectClassName = cn(
  "h-8 appearance-none rounded-lg border border-input bg-input px-2.5 pr-7 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
)

interface ApplicationFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
}

/** 검색 + 상태 필터 (job-filters.tsx의 FilterSelect 패턴을 단일 필터로 단순화) */
function ApplicationFilters({ search, onSearchChange, status, onStatusChange }: ApplicationFiltersProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border/40 p-3">
      <Input
        placeholder="지원 기업 검색 (회사명, 직무)"
        aria-label="지원 기업 검색"
        className="bg-input"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="relative w-fit">
        <select
          aria-label="상태 필터"
          className={selectClassName}
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="all">전체 상태</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}

export { ApplicationFilters, STATUS_OPTIONS }
