"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Plus } from "lucide-react"
import type { CompanyApplication } from "@app/shared"

import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingState } from "@/components/common/loading-state"
import { ListDetailPanel } from "@/components/common/list-detail-panel"
import { ApplicationFilters } from "@/components/sections/applications/application-filters"
import { ApplicationStatusBadge } from "@/components/sections/applications/status-badge"
import { ApplicationFormDialog } from "@/components/sections/applications/application-form-dialog"
import { fetchCompanyApplications } from "@/lib/company-applications"

// 목록 초기 로딩에는 필요 없는 상세 패널이므로 선택 시점에만 별도 청크로 불러온다
const ApplicationDetailContent = dynamic(
  () =>
    import("@/components/sections/applications/application-detail-content").then(
      (mod) => mod.ApplicationDetailContent
    ),
  { loading: () => <LoadingState variant="detail" /> }
)

function ApplicationsPageClient() {
  const [applications, setApplications] = useState<CompanyApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchCompanyApplications()
      .then((data) => {
        if (!cancelled) setApplications(data)
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

  // 개인 데이터로 수십 건 규모이므로 가상화 없이 일반 렌더링(filteredApplications.map())한다
  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const filtered = applications.filter((application) => {
      const matchesKeyword =
        keyword === "" ||
        application.companyName.toLowerCase().includes(keyword) ||
        (application.position ?? "").toLowerCase().includes(keyword)
      const matchesStatus = status === "all" || application.status === status

      return matchesKeyword && matchesStatus
    })

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [applications, search, status])

  const selectedApplication = applications.find((application) => application.id === selectedId) ?? null

  function handleCreated(result: CompanyApplication) {
    setApplications((prev) => [result, ...prev])
    setIsCreateOpen(false)
    setSelectedId(result.id)
  }

  function handleUpdated(result: CompanyApplication) {
    setApplications((prev) => prev.map((application) => (application.id === result.id ? result : application)))
  }

  function handleDeleted(id: string) {
    setApplications((prev) => prev.filter((application) => application.id !== id))
    setSelectedId(null)
  }

  return (
    <>
    <ListDetailPanel
      className="h-full md:grid-cols-[1fr_2fr]"
      showDetail={!!selectedApplication}
      onBack={() => setSelectedId(null)}
      list={
        <div className="flex h-full flex-col">
          <ApplicationFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
          />

          <div className="p-3">
            <Button className="w-full" onClick={() => setIsCreateOpen(true)}>
              <Plus />
              새 지원 기업 등록
            </Button>
          </div>

          {isLoading ? (
            <LoadingState variant="list" count={4} />
          ) : loadError ? (
            <EmptyState title="지원 기업 목록을 불러오지 못했습니다" description={loadError} />
          ) : filteredApplications.length === 0 ? (
            <EmptyState title="조건에 맞는 지원 기업이 없습니다" description="검색어나 필터를 변경해보세요" />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
              {filteredApplications.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => setSelectedId(application.id)}
                  aria-current={application.id === selectedId}
                  data-current={application.id === selectedId}
                  className="flex w-full flex-col gap-1.5 overflow-hidden rounded-xl bg-card p-3 text-left text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-ring/50 data-[current=true]:bg-muted"
                >
                  <p className="line-clamp-1 text-sm font-medium">{application.companyName}</p>
                  {application.position ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{application.position}</p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-1">
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      }
      detail={
        selectedApplication ? (
          <ApplicationDetailContent
            application={selectedApplication}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ) : (
          <EmptyState title="지원 기업을 선택해주세요" description="목록에서 지원 기업을 클릭하세요" />
        )
      }
    />

    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      {isCreateOpen ? (
        <ApplicationFormDialog mode="create" onOpenChange={setIsCreateOpen} onSuccess={handleCreated} />
      ) : null}
    </Dialog>
    </>
  )
}

export { ApplicationsPageClient }
