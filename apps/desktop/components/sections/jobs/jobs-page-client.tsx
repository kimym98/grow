"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { List, type RowComponentProps } from "react-window"
import type { JobPosting } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingState } from "@/components/common/loading-state"
import { ListDetailPanel } from "@/components/common/list-detail-panel"
import { JobFilters, type JobSortOption } from "@/components/sections/jobs/job-filters"
import { fetchJobPostings } from "@/lib/job-postings"

// 목록 화면 초기 로딩에는 필요 없는 상세 패널이므로 선택 시점에만 별도 청크로 불러온다
const JobDetailContent = dynamic(
  () => import("@/components/sections/jobs/job-detail-content").then((mod) => mod.JobDetailContent),
  { loading: () => <LoadingState variant="detail" /> }
)

const JOB_ROW_HEIGHT = 108

interface JobRowProps {
  jobs: JobPosting[]
  selectedJobId: string | null
  onSelect: (jobId: string) => void
}

function JobRow({ index, style, jobs, selectedJobId, onSelect }: RowComponentProps<JobRowProps>) {
  const job = jobs[index]

  return (
    <div style={style} className="px-3 pb-2">
      <button
        type="button"
        onClick={() => onSelect(job.id)}
        aria-current={job.id === selectedJobId}
        data-current={job.id === selectedJobId}
        className="flex w-full flex-col gap-1.5 rounded-xl bg-card p-3 text-left text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-ring/50 data-[current=true]:bg-muted"
      >
        <p className="text-sm font-medium">{job.title}</p>
        <p className="text-xs text-muted-foreground">
          {job.company} · {job.location}
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{job.source}</Badge>
          <Badge variant="outline">{job.careerLevel}</Badge>
          <Badge variant="secondary">{job.deadline ? `${job.deadline} 마감` : "상시채용"}</Badge>
        </div>
      </button>
    </div>
  )
}

function JobsPageClient() {
  const [allJobs, setAllJobs] = useState<JobPosting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("all")
  const [careerLevel, setCareerLevel] = useState("all")
  const [sort, setSort] = useState<JobSortOption>("deadline")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchJobPostings()
      .then((jobs) => {
        if (!cancelled) setAllJobs(jobs)
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
  }, [])

  const locationOptions = useMemo(
    () => Array.from(new Set(allJobs.map((job) => job.location))),
    [allJobs]
  )
  const careerLevelOptions = useMemo(
    () => Array.from(new Set(allJobs.map((job) => job.careerLevel))),
    [allJobs]
  )

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const filtered = allJobs.filter((job) => {
      const matchesKeyword =
        keyword === "" ||
        job.title.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword)
      const matchesLocation = location === "all" || job.location === location
      const matchesCareerLevel = careerLevel === "all" || job.careerLevel === careerLevel

      return matchesKeyword && matchesLocation && matchesCareerLevel
    })

    return filtered.sort((a, b) => {
      if (sort === "deadline") {
        // 마감일이 없는(상시채용) 공고는 뒤로 보낸다
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [allJobs, search, location, careerLevel, sort])

  const selectedJob = allJobs.find((job) => job.id === selectedJobId) ?? null

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId)
  }

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
    }
  }

  return (
    <ListDetailPanel
      className="h-full"
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
            sort={sort}
            onSortChange={setSort}
            locationOptions={locationOptions}
            careerLevelOptions={careerLevelOptions}
          />

          {isLoading ? (
            <LoadingState variant="list" count={4} />
          ) : loadError ? (
            <EmptyState title="채용 공고를 불러오지 못했습니다" description={loadError} />
          ) : filteredJobs.length === 0 ? (
            <EmptyState title="조건에 맞는 공고가 없습니다" description="검색어나 필터를 변경해보세요" />
          ) : (
            <div className="min-h-0 flex-1">
              <List
                rowComponent={JobRow}
                rowCount={filteredJobs.length}
                rowHeight={JOB_ROW_HEIGHT}
                rowProps={{ jobs: filteredJobs, selectedJobId, onSelect: handleSelectJob }}
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
