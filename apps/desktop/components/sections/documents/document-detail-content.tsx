"use client"

import { useState } from "react"
import { Copy, FileText } from "lucide-react"
import { toast } from "sonner"
import type { DocumentReview } from "@app/shared"

import { formatDate } from "@/lib/format"
import { getDocumentReviewSignedUrl } from "@/lib/document-reviews"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DocumentStatusBadge } from "@/components/sections/documents/document-status-badge"

interface DocumentDetailContentProps {
  document: DocumentReview
  canRetry: boolean
  isRetrying: boolean
  onRetry: () => void
}

function DocumentDetailContent({ document, canRetry, isRetrying, onRetry }: DocumentDetailContentProps) {
  const [selectedVersion, setSelectedVersion] = useState(
    document.versions.at(-1)?.version ?? document.version
  )

  async function handleCopyQuestion(question: string) {
    try {
      await navigator.clipboard.writeText(question)
      toast.success("질문을 복사했습니다")
    } catch {
      toast.error("복사에 실패했습니다")
    }
  }

  async function handleOpenPdf() {
    try {
      const { data: userData, error } = await supabase.auth.getUser()
      if (error) throw new Error(error.message)
      if (!userData.user) throw new Error("로그인이 필요합니다")

      const signedUrl = await getDocumentReviewSignedUrl(userData.user.id, document.id)
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF 열기에 실패했습니다")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <DocumentStatusBadge status={document.status} />
            <Badge variant="outline">{document.type === "resume" ? "이력서" : "포트폴리오"}</Badge>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleOpenPdf}>
            <FileText />
            PDF 원본 열기
          </Button>
        </div>
        <h1 className="text-2xl font-semibold">{document.title}</h1>
        <p className="text-xs text-muted-foreground">최종 수정일: {formatDate(document.updatedAt)}</p>
      </div>

      {document.versions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">버전 히스토리</h2>
          <div className="flex flex-wrap gap-2">
            {document.versions.map((version, index) => (
              <Button
                key={`${version.version}-${index}`}
                type="button"
                size="sm"
                variant={version.version === selectedVersion ? "default" : "outline"}
                onClick={() => setSelectedVersion(version.version)}
              >
                v{version.version} · {formatDate(version.createdAt)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {[...document.versions].reverse().find((version) => version.version === selectedVersion)?.summary}
          </p>
        </div>
      ) : null}

      {document.status === "completed" ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            첨삭이 완료되었습니다. 위 &ldquo;PDF 원본 열기&rdquo;로 원문 서식을 그대로 확인하며 아래 코멘트를 함께 보세요.
          </CardContent>
        </Card>
      ) : document.status === "failed" ? (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              첨삭에 실패했습니다
              {document.versions.at(-1)?.summary ? `: ${document.versions.at(-1)?.summary}` : "."}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="self-start"
              disabled={!canRetry || isRetrying}
              onClick={onRetry}
            >
              {isRetrying ? "재시도 중..." : "다시 시도"}
            </Button>
            {!canRetry ? (
              <p className="text-xs text-muted-foreground">
                등록된 AI API 키가 없어 재시도할 수 없습니다. 설정에서 키를 등록해주세요.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            첨삭이 진행 중입니다. 완료되면 자동으로 결과가 표시됩니다.
          </CardContent>
        </Card>
      )}

      {document.comments.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">코멘트</h2>
          {document.comments.map((comment) => (
            <Card key={comment.id} size="sm">
              <CardContent>
                <p className="text-xs text-muted-foreground">&ldquo;{comment.quote}&rdquo;</p>
                <p className="mt-1 text-sm">{comment.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {document.interviewQuestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">예상 면접 질문</h2>
          {document.interviewQuestions.map((question) => (
            <Card key={question.id} size="sm">
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary">{question.category}</Badge>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="질문 복사"
                    onClick={() => handleCopyQuestion(question.question)}
                  >
                    <Copy />
                  </Button>
                </div>
                <p className="mt-1 text-sm font-medium">{question.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">{question.intent}</p>
                {question.sourceQuote ? (
                  <p className="mt-1 text-xs text-muted-foreground">&ldquo;{question.sourceQuote}&rdquo;</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { DocumentDetailContent }
