"use client"

import { useMemo, useState } from "react"
import { computeDiffSegments, type DocumentReview } from "@app/shared"

import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentStatusBadge } from "@/components/sections/documents/document-status-badge"

interface DocumentDetailContentProps {
  document: DocumentReview
}

function DocumentDetailContent({ document }: DocumentDetailContentProps) {
  const [selectedVersion, setSelectedVersion] = useState(
    document.versions.at(-1)?.version ?? document.version
  )

  const diffSegments = useMemo(
    () => computeDiffSegments(document.originalText, document.reviewedText ?? document.originalText),
    [document.originalText, document.reviewedText]
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DocumentStatusBadge status={document.status} />
          <Badge variant="outline">{document.type === "resume" ? "자소서" : "포트폴리오"}</Badge>
        </div>
        <h1 className="text-2xl font-semibold">{document.title}</h1>
        {document.resumeQuestion ? (
          <p className="text-sm text-muted-foreground">문항: {document.resumeQuestion}</p>
        ) : null}
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
          <CardHeader>
            <CardTitle>첨삭 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {diffSegments.map((segment, index) => (
                <span
                  key={index}
                  className={cn(
                    segment.type === "added" && "bg-green-500/15 text-green-700 dark:text-green-400",
                    segment.type === "removed" &&
                      "text-red-700 line-through decoration-red-500/70 dark:text-red-400"
                  )}
                >
                  {segment.text}
                </span>
              ))}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            {document.status === "failed"
              ? "첨삭에 실패했습니다. 버전 히스토리에서 실패 사유를 확인해주세요."
              : "첨삭이 진행 중입니다. 완료되면 자동으로 결과가 표시됩니다."}
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
    </div>
  )
}

export { DocumentDetailContent }
