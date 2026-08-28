"use client"

import { useEffect, useState } from "react"
import { SearchX } from "lucide-react"
import { rowToJobPosting, type JobPosting, type JobPostingRow } from "@app/shared"

import { supabase } from "@/lib/supabase"
import { LoadingState } from "@/components/common/loading-state"
import { EmptyState } from "@/components/common/empty-state"
import { JobDetailContent } from "@/components/sections/jobs/job-detail-content"

interface JobDetailPageClientProps {
  id: string
}

function JobDetailPageClient({ id }: JobDetailPageClientProps) {
  const [job, setJob] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    setNotFound(false)

    supabase
      .from("job_postings")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return

        if (error || !data) {
          setNotFound(true)
        } else {
          setJob(rowToJobPosting(data as JobPostingRow))
        }

        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return <LoadingState variant="detail" />
  }

  if (notFound || !job) {
    return (
      <EmptyState
        icon={SearchX}
        title="공고를 찾을 수 없습니다"
        description="삭제되었거나 존재하지 않는 채용 공고입니다"
      />
    )
  }

  return <JobDetailContent job={job} />
}

export { JobDetailPageClient }
