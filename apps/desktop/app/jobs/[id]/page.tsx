import { notFound } from "next/navigation"
import { createJobPostingFixtures } from "@app/shared"

import { JobDetailContent } from "@/components/sections/jobs/job-detail-content"

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params
  const jobs = createJobPostingFixtures(12)
  const job = jobs.find((item) => item.id === id)

  if (!job) {
    notFound()
  }

  return <JobDetailContent job={job} />
}
