"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import type { CompanyApplication, CompanyApplicationStatus } from "@app/shared"

import { STATUS_OPTIONS } from "@/components/sections/applications/application-filters"
import { ApplicationStatusBadge } from "@/components/sections/applications/status-badge"
import { ApplicationFormDialog } from "@/components/sections/applications/application-form-dialog"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteCompanyApplication, updateCompanyApplication } from "@/lib/company-applications"

interface ApplicationDetailContentProps {
  application: CompanyApplication
  onUpdated: (result: CompanyApplication) => void
  onDeleted: (id: string) => void
}

function ApplicationDetailContent({ application, onUpdated, onDeleted }: ApplicationDetailContentProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)

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
        <h1 className="text-2xl font-semibold">{application.companyName}</h1>
        {application.position ? <p className="text-sm text-muted-foreground">{application.position}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          지원일: <span className="text-foreground">{application.appliedAt ?? "미입력"}</span>
        </p>
        {application.memo ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            메모: <span className="text-foreground">{application.memo}</span>
          </p>
        ) : null}
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
