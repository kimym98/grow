import { ChevronDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type JobSortOption = "deadline" | "latest"

interface JobFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  location: string
  onLocationChange: (value: string) => void
  careerLevel: string
  onCareerLevelChange: (value: string) => void
  source: string
  onSourceChange: (value: string) => void
  sort: JobSortOption
  onSortChange: (value: JobSortOption) => void
  locationOptions: string[]
  careerLevelOptions: string[]
  sourceOptions: string[]
}

const selectClassName = cn(
  "h-8 appearance-none rounded-lg border border-input bg-input px-2.5 pr-7 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
)

interface FilterSelectProps {
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

/** 지역/경력/사이트/정렬 select가 공유하는 네이티브 select 껍데기 — appearance-none으로 OS 기본 렌더링을 제거하고 rounded-lg가 실제로 보이도록 커스텀 화살표를 덧붙인다 */
function FilterSelect({ ariaLabel, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        className={selectClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

function JobFilters({
  search,
  onSearchChange,
  location,
  onLocationChange,
  careerLevel,
  onCareerLevelChange,
  source,
  onSourceChange,
  sort,
  onSortChange,
  locationOptions,
  careerLevelOptions,
  sourceOptions,
}: JobFiltersProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border/40 p-3">
      <Input
        placeholder="공고 검색 (제목, 회사명)"
        aria-label="공고 검색"
        className="bg-input"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <FilterSelect
          ariaLabel="지역 필터"
          value={location}
          onChange={onLocationChange}
          options={[
            { value: "all", label: "전체 지역" },
            ...locationOptions.map((option) => ({ value: option, label: option })),
          ]}
        />

        <FilterSelect
          ariaLabel="경력 필터"
          value={careerLevel}
          onChange={onCareerLevelChange}
          options={[
            { value: "all", label: "전체 경력" },
            ...careerLevelOptions.map((option) => ({ value: option, label: option })),
          ]}
        />

        <FilterSelect
          ariaLabel="사이트 필터"
          value={source}
          onChange={onSourceChange}
          options={[
            { value: "all", label: "전체 사이트" },
            ...sourceOptions.map((option) => ({ value: option, label: option.toUpperCase() })),
          ]}
        />

        <FilterSelect
          ariaLabel="정렬"
          value={sort}
          onChange={(value) => onSortChange(value as JobSortOption)}
          options={[
            { value: "deadline", label: "마감임박순" },
            { value: "latest", label: "최신순" },
          ]}
        />
      </div>
    </div>
  )
}

export { JobFilters }
