"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import type { CompanyAnalysis, CompanyApplication, CompanyApplicationStatus } from "@app/shared"

import { STATUS_OPTIONS } from "@/components/sections/applications/application-filters"
import { ApplicationStatusBadge } from "@/components/sections/applications/status-badge"
import { ApplicationFormDialog } from "@/components/sections/applications/application-form-dialog"
import { ApplicationMemoPopover } from "@/components/sections/applications/application-memo-popover"
import { CompanyAnalysisCard } from "@/components/sections/applications/company-analysis-card"
import { CoverLetterQuestionsSection } from "@/components/sections/applications/cover-letter-questions-section"
import { ApplicationDocumentsSection } from "@/components/sections/applications/application-documents-section"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteCompanyApplication, updateCompanyApplication } from "@/lib/company-applications"
import { fetchCompanyAnalysis, triggerCompanyAnalysis } from "@/lib/company-analyses"
import { fetchLlmKeyStatuses, type LlmProviderName } from "@/lib/llm-keys"

const ANALYSIS_POLL_INTERVAL_MS = 4000

interface ApplicationDetailContentProps {
  application: CompanyApplication
  onUpdated: (result: CompanyApplication) => void
  onDeleted: (id: string) => void
}

function ApplicationDetailContent({ application, onUpdated, onDeleted }: ApplicationDetailContentProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)

  const [analysis, setAnalysis] = useState<CompanyAnalysis | null>(null)
  const [availableProviders, setAvailableProviders] = useState<LlmProviderName[]>([])
  const [isTriggeringAnalysis, setIsTriggeringAnalysis] = useState(false)
  const analysisPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadAnalysis = useCallback(async () => {
    try {
      setAnalysis(await fetchCompanyAnalysis(application.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "기업 분석 결과를 불러오지 못했습니다")
    }
  }, [application.id])

  // 지원 기업이 바뀔 때(상세 선택 전환)마다 최신 분석 결과와 등록된 provider 목록을 다시 조회한다
  useEffect(() => {
    loadAnalysis()
    fetchLlmKeyStatuses()
      .then((statuses) => setAvailableProviders(statuses.map((status) => status.provider)))
      .catch(() => setAvailableProviders([]))
  }, [loadAnalysis])

  // 분석이 진행 중일 때만 완료/실패로 바뀔 때까지 주기적으로 다시 조회한다
  useEffect(() => {
    const isInFlight = analysis?.status === "processing"

    if (isInFlight && !analysisPollTimerRef.current) {
      analysisPollTimerRef.current = setInterval(loadAnalysis, ANALYSIS_POLL_INTERVAL_MS)
    } else if (!isInFlight && analysisPollTimerRef.current) {
      clearInterval(analysisPollTimerRef.current)
      analysisPollTimerRef.current = null
    }

    return () => {
      if (analysisPollTimerRef.current) {
        clearInterval(analysisPollTimerRef.current)
        analysisPollTimerRef.current = null
      }
    }
  }, [analysis?.status, loadAnalysis])

  async function handleTriggerAnalysis() {
    if (availableProviders.length === 0) {
      toast.error("먼저 설정에서 LLM API 키를 등록해주세요")
      return
    }

    setIsTriggeringAnalysis(true)
    try {
      await triggerCompanyAnalysis(application.id, availableProviders[0])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "기업 분석 요청에 실패했습니다")
    } finally {
      await loadAnalysis()
      setIsTriggeringAnalysis(false)
    }
  }

  async function handleStatusChange(status: CompanyApplicationStatus) {
    setIsStatusUpdating(true)
    try {
      const result = await updateCompanyApplication(application.id, { status })
      onUpdated(result)
      toast.success("상태를 변경했습니다")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "상태 변경에 실패했습니다")
    } finally {
      setIsStatusUpdating(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm("이 지원 기업 정보를 삭제하시겠습니까?")) return

    setIsDeleting(true)
    try {
      await deleteCompanyApplication(application.id)
      toast.success("삭제했습니다")
      onDeleted(application.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제에 실패했습니다")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <ApplicationStatusBadge status={application.status} />
        <div className="flex items-center gap-1.5">
          <h1 className="text-2xl font-semibold">{application.companyName}</h1>
          <ApplicationMemoPopover application={application} onSuccess={onUpdated} />
        </div>
        {application.position ? <p className="text-sm text-muted-foreground">{application.position}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          지원일: <span className="text-foreground">{application.appliedAt ?? "미입력"}</span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">상태 변경</span>
        <Select
          value={application.status}
          onValueChange={(value) => handleStatusChange(value as CompanyApplicationStatus)}
          disabled={isStatusUpdating}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {application.applyUrl ? (
          <Button asChild variant="outline">
            <Link href={application.applyUrl} target="_blank" rel="noopener noreferrer">
              지원 링크 열기
            </Link>
          </Button>
        ) : null}
        {application.sourceJobPostingId ? (
          <Button asChild variant="outline">
            <Link href={`/jobs?id=${application.sourceJobPostingId}`}>원본 공고 보기</Link>
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => setIsEditOpen(true)}>
          수정
        </Button>
        <Button variant="outline" onClick={handleDelete} disabled={isDeleting}>
          삭제
        </Button>
      </div>

      <CompanyAnalysisCard
        application={application}
        analysis={analysis}
        isTriggering={isTriggeringAnalysis}
        canRetry={availableProviders.length > 0}
        onTrigger={handleTriggerAnalysis}
      />

      <CoverLetterQuestionsSection
        key={`cover-letter-${application.id}`}
        applicationId={application.id}
        companyAnalysisStatus={analysis?.status ?? null}
        feedbackProvider={availableProviders[0] ?? null}
      />

      <ApplicationDocumentsSection key={`documents-${application.id}`} applicationId={application.id} />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {isEditOpen ? (
          <ApplicationFormDialog
            mode="edit"
            initialValues={application}
            onOpenChange={setIsEditOpen}
            onSuccess={(result) => {
              setIsEditOpen(false)
              onUpdated(result)
            }}
          />
        ) : null}
      </Dialog>
    </div>
  )
}

export { ApplicationDetailContent }
