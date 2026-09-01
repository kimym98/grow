import { Suspense } from "react"

import { ApplicationsPageClient } from "@/components/sections/applications/applications-page-client"

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsPageClient />
    </Suspense>
  )
}
