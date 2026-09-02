"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Plus, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import type { DocumentReview } from "@app/shared"

import type { DocumentUploadFormValues } from "@/lib/validators"
import { uploadDocument } from "@/lib/document-upload"
import { fetchDocumentReviews, triggerDocumentReview } from "@/lib/document-reviews"
import { fetchLlmKeyStatuses, type LlmProviderName } from "@/lib/llm-keys"
import { useRecentFavoritesStore } from "@/lib/stores/recent-favorites-store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingState } from "@/components/common/loading-state"
import { ListDetailPanel } from "@/components/common/list-detail-panel"
import { DocumentStatusBadge } from "@/components/sections/documents/document-status-badge"

// 상세/업로드 다이얼로그는 선택·오픈 시점에만 필요하므로 별도 청크로 분리한다
const DocumentDetailContent = dynamic(
  () =>
    import("@/components/sections/documents/document-detail-content").then(
      (mod) => mod.DocumentDetailContent
    ),
  { loading: () => <LoadingState variant="detail" /> }
)
const DocumentUploadDropzone = dynamic(
  () =>
    import("@/components/sections/documents/document-upload-dropzone").then(
      (mod) => mod.DocumentUploadDropzone
    )
)

const POLL_INTERVAL_MS = 4000

function DocumentsPageClient() {
  const searchParams = useSearchParams()

  const [documents, setDocuments] = useState<DocumentReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [availableProviders, setAvailableProviders] = useState<LlmProviderName[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(() =>
    searchParams.get("id")
  )
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [retryingDocumentId, setRetryingDocumentId] = useState<string | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId]
  )

  const addRecent = useRecentFavoritesStore((state) => state.addRecent)

  useEffect(() => {
    if (!selectedDocument) return

    addRecent({
      key: `document:${selectedDocument.id}`,
      type: "document",
      id: selectedDocument.id,
      title: selectedDocument.title,
      subtitle: selectedDocument.type === "resume" ? "이력서" : "포트폴리오",
      href: `/documents?id=${selectedDocument.id}`,
    })
  }, [addRecent, selectedDocument])

  const loadDocuments = useCallback(async () => {
    try {
      setDocuments(await fetchDocumentReviews())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "문서 목록을 불러오지 못했습니다")
    }
  }, [])

  useEffect(() => {
    async function init() {
      setIsLoading(true)
      try {
        const [statuses] = await Promise.all([fetchLlmKeyStatuses(), loadDocuments()])
        setAvailableProviders(statuses.map((status) => status.provider))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "설정을 불러오지 못했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [loadDocuments])

  // 첨삭이 진행 중인 문서가 있으면 완료될 때까지 주기적으로 목록을 다시 불러온다
  useEffect(() => {
    const hasInFlight = documents.some(
      (document) => document.status === "pending" || document.status === "processing"
    )

    if (hasInFlight && !pollTimerRef.current) {
      pollTimerRef.current = setInterval(loadDocuments, POLL_INTERVAL_MS)
    } else if (!hasInFlight && pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [documents, loadDocuments])

  async function handleUpload(file: File, values: DocumentUploadFormValues) {
    try {
      const { documentReviewId } = await uploadDocument({
        file,
        title: values.fileName,
        type: values.type,
      })

      setSelectedDocumentId(documentReviewId)
      await loadDocuments()

      triggerDocumentReview(documentReviewId, values.provider).catch((error) => {
        toast.error(error instanceof Error ? error.message : "첨삭 요청에 실패했습니다")
        loadDocuments()
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "문서 업로드에 실패했습니다")
    }
  }

  async function handleRetry(documentReviewId: string) {
    if (availableProviders.length === 0) {
      toast.error("먼저 설정에서 LLM API 키를 등록해주세요")
      return
    }

    setRetryingDocumentId(documentReviewId)
    try {
      await triggerDocumentReview(documentReviewId, availableProviders[0])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "첨삭 재시도에 실패했습니다")
    } finally {
      await loadDocuments()
      setRetryingDocumentId(null)
    }
  }

  const hasRegisteredKey = availableProviders.length > 0

  function handleUploadClick() {
    if (!hasRegisteredKey) {
      toast.error("먼저 설정에서 LLM API 키를 등록해주세요")
      return
    }
    setIsUploadOpen(true)
  }

  return (
    <>
      <ListDetailPanel
        className="h-full"
        showDetail={!!selectedDocument}
        onBack={() => setSelectedDocumentId(null)}
        list={
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/40 p-3">
              <h1 className="text-sm font-medium">문서 첨삭</h1>
              <Button size="sm" onClick={handleUploadClick}>
                <Plus />
                업로드
              </Button>
            </div>

            {!hasRegisteredKey && !isLoading ? (
              <Alert className="m-3 w-auto" variant="destructive">
                <TriangleAlert />
                <AlertTitle>등록된 AI API 키가 없습니다</AlertTitle>
                <AlertDescription>
                  문서 첨삭을 사용하려면 먼저{" "}
                  <Link href="/settings">설정에서 Gemini 또는 Anthropic API 키를 등록</Link>해주세요.
                </AlertDescription>
              </Alert>
            ) : null}

            {isLoading ? (
              <LoadingState variant="list" count={4} />
            ) : documents.length === 0 ? (
              <EmptyState title="업로드한 문서가 없습니다" description="첨삭받을 문서를 업로드해보세요" />
            ) : (
              <ul className="flex flex-col gap-2 p-3">
                {documents.map((document) => (
                  <li key={document.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDocumentId(document.id)}
                      aria-current={document.id === selectedDocumentId}
                      data-current={document.id === selectedDocumentId}
                      className="flex w-full flex-col gap-1.5 rounded-xl bg-card p-3 text-left text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-ring/50 data-[current=true]:bg-muted"
                    >
                      <p className="text-sm font-medium">{document.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.type === "resume" ? "이력서" : "포트폴리오"} · v{document.version}
                      </p>
                      <DocumentStatusBadge status={document.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
        detail={
          selectedDocument ? (
            <DocumentDetailContent
              document={selectedDocument}
              canRetry={hasRegisteredKey}
              isRetrying={retryingDocumentId === selectedDocument.id}
              onRetry={() => handleRetry(selectedDocument.id)}
            />
          ) : (
            <EmptyState title="문서를 선택해주세요" description="목록에서 첨삭받을 문서를 클릭하세요" />
          )
        }
      />

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        {isUploadOpen ? (
          <DocumentUploadDropzone
            availableProviders={availableProviders}
            onSubmit={handleUpload}
            onOpenChange={setIsUploadOpen}
          />
        ) : null}
      </Dialog>
    </>
  )
}

export { DocumentsPageClient }
