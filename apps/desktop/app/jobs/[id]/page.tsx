import { notFound } from "next/navigation"
import { rowToJobPosting, type JobPostingRow } from "@app/shared"

import { supabase } from "@/lib/supabase"
import { JobDetailContent } from "@/components/sections/jobs/job-detail-content"

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params

  const { data, error } = await supabase.from("job_postings").select("*").eq("id", id).maybeSingle()

  if (error || !data) {
    notFound()
  }

  const job = rowToJobPosting(data as JobPostingRow)

  return <JobDetailContent job={job} />
}
