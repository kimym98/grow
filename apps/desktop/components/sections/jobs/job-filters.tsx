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
  sort: JobSortOption
  onSortChange: (value: JobSortOption) => void
  locationOptions: string[]
  careerLevelOptions: string[]
}

const selectClassName = cn(
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "dark:bg-input/30"
)

function JobFilters({
  search,
  onSearchChange,
  location,
  onLocationChange,
  careerLevel,
  onCareerLevelChange,
  sort,
  onSortChange,
  locationOptions,
  careerLevelOptions,
}: JobFiltersProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border/40 p-3">
      <Input
        placeholder="공고 검색 (제목, 회사명)"
        aria-label="공고 검색"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="지역 필터"
          className={selectClassName}
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
        >
          <option value="all">전체 지역</option>
          {locationOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          aria-label="경력 필터"
          className={selectClassName}
          value={careerLevel}
          onChange={(event) => onCareerLevelChange(event.target.value)}
        >
          <option value="all">전체 경력</option>
          {careerLevelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          aria-label="정렬"
          className={selectClassName}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as JobSortOption)}
        >
          <option value="deadline">마감임박순</option>
          <option value="latest">최신순</option>
        </select>
      </div>
    </div>
  )
}

export { JobFilters }
