import { Suspense } from "react"

import { JobsPageClient } from "@/components/sections/jobs/jobs-page-client"

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsPageClient />
    </Suspense>
  )
}
