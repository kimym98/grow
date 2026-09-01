"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { DocumentReview } from "@app/shared"

import {
  fetchApplicationDocuments,
  getApplicationDocumentSignedUrl,
  linkDocumentToApplication,
  unlinkApplicationDocument,
  type ApplicationDocumentWithReview,
} from "@/lib/application-documents"
import { documentFileSchema, uploadDocument } from "@/lib/document-upload"
import { fetchDocumentReviews } from "@/lib/document-reviews"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ApplicationDocumentsSectionProps {
  applicationId: string
}

const DOCUMENT_TYPE_LABEL: Record<DocumentReview["type"], string> = {
  resume: "자소서",
  portfolio: "포트폴리오",
}

/** 새 PDF 업로드 후 즉시 지원 내역에 연결하는 다이얼로그 (document-upload.ts::uploadDocument 재사용) */
function UploadDialog({
  applicationId,
  onOpenChange,
  onSuccess,
}: {
  applicationId: string
  onOpenChange: (open: boolean) => void
  onSuccess: (result: ApplicationDocumentWithReview) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [type, setType] = useState<DocumentReview["type"]>("resume")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit() {
    if (!file) {
      toast.error("PDF 파일을 선택해주세요")
      return
    }

    const fileCheck = documentFileSchema.safeParse(file)
    if (!fileCheck.success) {
      toast.error(fileCheck.error.issues[0]?.message ?? "파일이 올바르지 않습니다")
      return
    }

    if (!title.trim()) {
      toast.error("제목을 입력해주세요")
      return
    }

    setIsSaving(true)
    try {
      const { documentReviewId } = await uploadDocument({ file, title, type })
      const linked = await linkDocumentToApplication(applicationId, documentReviewId)
      const documents = await fetchDocumentReviews()
      const documentReview = documents.find((document) => document.id === documentReviewId)
      if (!documentReview) throw new Error("업로드한 서류를 찾지 못했습니다")

      toast.success("서류를 업로드하고 연결했습니다")
      onSuccess({ ...linked, documentReview })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "서류 업로드에 실패했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>새 서류 업로드</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="application-document-file">PDF 파일</Label>
          <Input
            id="application-document-file"
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="application-document-title">제목</Label>
          <Input
            id="application-document-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 2026 상반기 이력서"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>종류</Label>
          <Select value={type} onValueChange={(value) => setType(value as DocumentReview["type"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resume">자소서</SelectItem>
              <SelectItem value="portfolio">포트폴리오</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          취소
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : null}
          업로드
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

/** 지원 기업 상세의 제출 서류 섹션 (업로드+연결/기존 문서 연결/목록/다운로드/첨삭결과 링크/연결 해제) */
function ApplicationDocumentsSection({ applicationId }: ApplicationDocumentsSectionProps) {
  const [linkedDocuments, setLinkedDocuments] = useState<ApplicationDocumentWithReview[]>([])
  const [allDocuments, setAllDocuments] = useState<DocumentReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("")
  const [isLinking, setIsLinking] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

  async function loadAll() {
    try {
      const [linked, all] = await Promise.all([
        fetchApplicationDocuments(applicationId),
        fetchDocumentReviews(),
      ])
      setLinkedDocuments(linked)
      setAllDocuments(all)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "제출 서류를 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId])

  const linkableDocuments = useMemo(() => {
    const linkedIds = new Set(linkedDocuments.map((item) => item.documentReviewId))
    return allDocuments.filter((document) => !linkedIds.has(document.id))
  }, [allDocuments, linkedDocuments])

  async function handleLinkExisting() {
    if (!selectedDocumentId) {
      toast.error("연결할 서류를 선택해주세요")
      return
    }

    setIsLinking(true)
    try {
      await linkDocumentToApplication(applicationId, selectedDocumentId)
      toast.success("서류를 연결했습니다")
      setSelectedDocumentId("")
      await loadAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "서류 연결에 실패했습니다")
    } finally {
      setIsLinking(false)
    }
  }

  async function handleUnlink(id: string) {
    if (!window.confirm("이 서류의 연결을 해제하시겠습니까?")) return

    setUnlinkingId(id)
    try {
      await unlinkApplicationDocument(id)
      toast.success("연결을 해제했습니다")
      setLinkedDocuments((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "연결 해제에 실패했습니다")
    } finally {
      setUnlinkingId(null)
    }
  }

  async function handleDownload(documentReviewId: string) {
    try {
      const { data: userData, error } = await supabase.auth.getUser()
      if (error) throw new Error(error.message)
      if (!userData.user) throw new Error("로그인이 필요합니다")

      const signedUrl = await getApplicationDocumentSignedUrl(userData.user.id, documentReviewId)
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "다운로드 링크 발급에 실패했습니다")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>제출 서류</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : linkedDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground">연결된 제출 서류가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {linkedDocuments.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.documentReview.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {DOCUMENT_TYPE_LABEL[item.documentReview.type]}
                    {item.submittedAt ? ` · 제출일 ${item.submittedAt}` : ""}
                    {item.memo ? ` · ${item.memo}` : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => handleDownload(item.documentReviewId)}>
                    다운로드
                  </Button>
                  {item.documentReview.status === "completed" ? (
                    <Button asChild type="button" size="sm" variant="outline">
                      <Link href={`/documents?id=${item.documentReviewId}`}>첨삭 결과 보기</Link>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleUnlink(item.id)}
                    disabled={unlinkingId === item.id}
                  >
                    연결 해제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="기존 서류 선택" />
            </SelectTrigger>
            <SelectContent>
              {linkableDocuments.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">연결 가능한 서류가 없습니다</div>
              ) : (
                linkableDocuments.map((document) => (
                  <SelectItem key={document.id} value={document.id}>
                    {document.title} ({DOCUMENT_TYPE_LABEL[document.type]})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={handleLinkExisting} disabled={isLinking}>
            {isLinking ? <Loader2 className="animate-spin" /> : null}
            기존 서류 연결
          </Button>
        </div>

        <Button type="button" variant="outline" className="self-start" onClick={() => setIsUploadOpen(true)}>
          새 서류 업로드
        </Button>
      </CardContent>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        {isUploadOpen ? (
          <UploadDialog
            applicationId={applicationId}
            onOpenChange={setIsUploadOpen}
            onSuccess={(result) => {
              setIsUploadOpen(false)
              setLinkedDocuments((prev) => [result, ...prev])
              setAllDocuments((prev) => [result.documentReview, ...prev])
            }}
          />
        ) : null}
      </Dialog>
    </Card>
  )
}

export { ApplicationDocumentsSection }
