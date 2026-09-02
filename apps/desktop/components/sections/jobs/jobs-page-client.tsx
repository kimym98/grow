"use client"

import { memo, useCallback, useEffect, useMemo, useState, type ReactElement } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { List, type RowComponentProps } from "react-window"
import type { JobPosting } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingState } from "@/components/common/loading-state"
import { ListDetailPanel } from "@/components/common/list-detail-panel"
import { JobFilters, type JobSortOption } from "@/components/sections/jobs/job-filters"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import {
  fetchJobFilterOptions,
  fetchJobPostingById,
  fetchJobPostings,
  JOB_POSTINGS_PAGE_SIZE,
  type JobFilterOptions,
} from "@/lib/job-postings"

// 목록 화면 초기 로딩에는 필요 없는 상세 패널이므로 선택 시점에만 별도 청크로 불러온다
const JobDetailContent = dynamic(
  () => import("@/components/sections/jobs/job-detail-content").then((mod) => mod.JobDetailContent),
  { loading: () => <LoadingState variant="detail" /> }
)

const JOB_ROW_HEIGHT = 132

interface JobRowProps {
  jobs: JobPosting[]
  selectedJobId: string | null
  onSelect: (jobId: string) => void
  hasMore: boolean
  sentinelRef: (node: HTMLElement | null) => void
}

const JobRow = memo(function JobRow({
  index,
  style,
  jobs,
  selectedJobId,
  onSelect,
  hasMore,
  sentinelRef,
}: RowComponentProps<JobRowProps>) {
  // jobs 뒤에 추가된 마지막 index는 다음 페이지 로딩을 트리거하는 센티넬 row다
  if (index >= jobs.length) {
    return (
      <div style={style} ref={hasMore ? sentinelRef : undefined} className="flex items-center justify-center px-3 pb-2">
        <LoadingState variant="list" count={1} />
      </div>
    )
  }

  const job = jobs[index]

  return (
    <div style={style} className="px-3 pb-2">
      <button
        type="button"
        onClick={() => onSelect(job.id)}
        aria-current={job.id === selectedJobId}
        data-current={job.id === selectedJobId}
        className="flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-xl bg-card p-3 text-left text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-ring/50 data-[current=true]:bg-muted"
      >
        <p className="line-clamp-2 text-sm font-medium">{job.title}</p>
        <p className="text-xs text-muted-foreground">
          {[job.company, job.location].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto flex flex-wrap gap-1">
          <Badge variant="outline" className="uppercase">{job.source}</Badge>
          {job.careerLevel ? <Badge variant="outline">{job.careerLevel}</Badge> : null}
          <Badge variant="secondary">{job.deadline ? `${job.deadline} 마감` : "상시채용"}</Badge>
        </div>
      </button>
    </div>
  )
}) as (props: RowComponentProps<JobRowProps>) => ReactElement

function JobsPageClient() {
  const searchParams = useSearchParams()

  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [filterOptions, setFilterOptions] = useState<JobFilterOptions>({
    locations: [],
    careerLevels: [],
    sources: [],
  })

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [location, setLocation] = useState("all")
  const [careerLevel, setCareerLevel] = useState("all")
  const [source, setSource] = useState("all")
  const [sort, setSort] = useState<JobSortOption>("deadline")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => searchParams.get("id"))
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)

  useEffect(() => {
    fetchJobFilterOptions()
      .then(setFilterOptions)
      .catch(() => {
        // 필터 옵션 조회 실패는 치명적이지 않으므로 조용히 무시한다("전체" 옵션만 노출)
      })
  }, [])

  // 검색/필터/정렬이 바뀌면 첫 페이지부터 다시 조회한다
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 필터/정렬 변경 시 즉시 로딩 표시로 전환하기 위한 동기 초기화
    setIsLoading(true)
    setLoadError(null)

    fetchJobPostings({
      page: 0,
      pageSize: JOB_POSTINGS_PAGE_SIZE,
      search: debouncedSearch,
      location,
      careerLevel,
      source,
      sort,
    })
      .then((result) => {
        if (cancelled) return
        setJobs(result)
        setPage(0)
        setHasMore(result.length === JOB_POSTINGS_PAGE_SIZE)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, location, careerLevel, source, sort])

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true)
    const nextPage = page + 1

    fetchJobPostings({
      page: nextPage,
      pageSize: JOB_POSTINGS_PAGE_SIZE,
      search: debouncedSearch,
      location,
      careerLevel,
      source,
      sort,
    })
      .then((result) => {
        setJobs((prev) => [...prev, ...result])
        setPage(nextPage)
        setHasMore(result.length === JOB_POSTINGS_PAGE_SIZE)
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        setIsLoadingMore(false)
      })
  }, [page, debouncedSearch, location, careerLevel, source, sort])

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore || isLoading,
    onLoadMore: handleLoadMore,
  })

  // 선택된 공고는 목록(첫 페이지)에 없을 수 있으므로 상세 조회로 별도 확보한다
  useEffect(() => {
    if (!selectedJobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 선택 해제 시 상세 패널을 즉시 비우기 위한 동기 초기화
      setSelectedJob(null)
      return
    }

    const inList = jobs.find((job) => job.id === selectedJobId)
    if (inList) {
      setSelectedJob(inList)
      return
    }

    let cancelled = false
    fetchJobPostingById(selectedJobId)
      .then((job) => {
        if (!cancelled) setSelectedJob(job)
      })
      .catch(() => {
        if (!cancelled) setSelectedJob(null)
      })

    return () => {
      cancelled = true
    }
  }, [selectedJobId, jobs])

  const handleSelectJob = useCallback((jobId: string) => {
    setSelectedJobId(jobId)
  }, [])

  const rowCount = jobs.length + (hasMore ? 1 : 0)

  const jobRowProps = useMemo(
    () => ({ jobs, selectedJobId, onSelect: handleSelectJob, hasMore, sentinelRef }),
    [jobs, selectedJobId, handleSelectJob, hasMore, sentinelRef]
  )

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
    }
  }

  return (
    <ListDetailPanel
      className="h-full md:grid-cols-[1fr_1fr]"
      showDetail={!!selectedJob}
      onBack={() => setSelectedJobId(null)}
      list={
        <div className="flex h-full flex-col">
          <JobFilters
            search={search}
            onSearchChange={handleFilterChange(setSearch)}
            location={location}
            onLocationChange={handleFilterChange(setLocation)}
            careerLevel={careerLevel}
            onCareerLevelChange={handleFilterChange(setCareerLevel)}
            source={source}
            onSourceChange={handleFilterChange(setSource)}
            sort={sort}
            onSortChange={setSort}
            locationOptions={filterOptions.locations}
            careerLevelOptions={filterOptions.careerLevels}
            sourceOptions={filterOptions.sources}
          />

          {isLoading ? (
            <LoadingState variant="list" count={4} />
          ) : loadError ? (
            <EmptyState title="채용 공고를 불러오지 못했습니다" description={loadError} />
          ) : jobs.length === 0 ? (
            <EmptyState title="조건에 맞는 공고가 없습니다" description="검색어나 필터를 변경해보세요" />
          ) : (
            <div className="min-h-0 flex-1">
              <List
                rowComponent={JobRow}
                rowCount={rowCount}
                rowHeight={JOB_ROW_HEIGHT}
                rowProps={jobRowProps}
              />
            </div>
          )}
        </div>
      }
      detail={
        selectedJob ? (
          <JobDetailContent job={selectedJob} />
        ) : (
          <EmptyState title="공고를 선택해주세요" description="목록에서 관심 있는 공고를 클릭하세요" />
        )
      }
    />
  )
}

export { JobsPageClient }
