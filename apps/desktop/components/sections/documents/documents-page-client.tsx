"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { createDocumentReviewFixtures, type DocumentReviewFixture } from "@app/shared"

import type { DocumentUploadFormValues } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/common/empty-state"
import { ListDetailPanel } from "@/components/common/list-detail-panel"
import { DocumentDetailContent } from "@/components/sections/documents/document-detail-content"
import { DocumentStatusBadge } from "@/components/sections/documents/document-status-badge"
import { DocumentUploadDropzone } from "@/components/sections/documents/document-upload-dropzone"

interface DocumentsPageClientProps {
  initialSelectedId?: string
}

function DocumentsPageClient({ initialSelectedId }: DocumentsPageClientProps) {
  const [documents, setDocuments] = useState<DocumentReviewFixture[]>(() =>
    createDocumentReviewFixtures(6)
  )
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    initialSelectedId ?? null
  )
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId]
  )

  function handleUpload(values: DocumentUploadFormValues) {
    const seed = documents.length + 1

    const newDocument: DocumentReviewFixture = {
      id: `document-upload-${seed}`,
      title: values.fileName,
      type: values.type,
      status: "pending",
      version: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      resumeQuestion: values.type === "resume" ? values.resumeQuestion : undefined,
      versions: [{ version: 1, createdAt: new Date().toISOString().slice(0, 10), summary: "업로드된 원본" }],
      diffSegments: [{ type: "unchanged", text: "첨삭 대기 중입니다." }],
      comments: [],
    }

    setDocuments((prev) => [newDocument, ...prev])
    setSelectedDocumentId(newDocument.id)
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
              <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                <Plus />
                업로드
              </Button>
            </div>

            {documents.length === 0 ? (
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
                        {document.type === "resume" ? "자소서" : "포트폴리오"} · v{document.version} ·{" "}
                        {document.updatedAt}
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
            <DocumentDetailContent document={selectedDocument} />
          ) : (
            <EmptyState title="문서를 선택해주세요" description="목록에서 첨삭받을 문서를 클릭하세요" />
          )
        }
      />

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        {isUploadOpen ? (
          <DocumentUploadDropzone onSubmit={handleUpload} onOpenChange={setIsUploadOpen} />
        ) : null}
      </Dialog>
    </>
  )
}

export { DocumentsPageClient }
