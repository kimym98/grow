"use client"

import { useMemo, useState } from "react"
import { createJobPostingFixtures, type JobPostingFixture } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { ListDetailPanel } from "@/components/common/list-detail-panel"
import { JobFilters, type JobSortOption } from "@/components/sections/jobs/job-filters"
import { JobDetailContent } from "@/components/sections/jobs/job-detail-content"

const PAGE_SIZE = 6

function getJobIdSeed(job: JobPostingFixture) {
  return Number(job.id.split("-").at(-1) ?? 0)
}

function JobsPageClient() {
  const allJobs = useMemo(() => createJobPostingFixtures(12), [])

  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("all")
  const [careerLevel, setCareerLevel] = useState("all")
  const [sort, setSort] = useState<JobSortOption>("deadline")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

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
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      return getJobIdSeed(b) - getJobIdSeed(a)
    })
  }, [allJobs, search, location, careerLevel, sort])

  const visibleJobs = filteredJobs.slice(0, visibleCount)
  const selectedJob = allJobs.find((job) => job.id === selectedJobId) ?? null

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId)
  }

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setVisibleCount(PAGE_SIZE)
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

          {visibleJobs.length === 0 ? (
            <EmptyState title="조건에 맞는 공고가 없습니다" description="검색어나 필터를 변경해보세요" />
          ) : (
            <ul className="flex flex-col gap-2 p-3">
              {visibleJobs.map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectJob(job.id)}
                    aria-current={job.id === selectedJobId}
                    data-current={job.id === selectedJobId}
                    className="flex w-full flex-col gap-1.5 rounded-xl bg-card p-3 text-left text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-ring/50 data-[current=true]:bg-muted"
                  >
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.company} · {job.location}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{job.careerLevel}</Badge>
                      <Badge variant="secondary">{job.deadline} 마감</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {visibleCount < filteredJobs.length ? (
            <div className="flex justify-center p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                더 보기
              </Button>
            </div>
          ) : null}
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
