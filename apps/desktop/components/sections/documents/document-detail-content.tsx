"use client"

import { useState } from "react"
import type { DocumentReviewFixture } from "@app/shared"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentStatusBadge } from "@/components/sections/documents/document-status-badge"

interface DocumentDetailContentProps {
  document: DocumentReviewFixture
}

function DocumentDetailContent({ document }: DocumentDetailContentProps) {
  const [selectedVersion, setSelectedVersion] = useState(
    document.versions.at(-1)?.version ?? document.version
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
        <p className="text-xs text-muted-foreground">최종 수정일: {document.updatedAt}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">버전 히스토리</h2>
        <div className="flex flex-wrap gap-2">
          {document.versions.map((version) => (
            <Button
              key={version.version}
              type="button"
              size="sm"
              variant={version.version === selectedVersion ? "default" : "outline"}
              onClick={() => setSelectedVersion(version.version)}
            >
              v{version.version} · {version.createdAt}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {document.versions.find((version) => version.version === selectedVersion)?.summary}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>첨삭 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {document.diffSegments.map((segment, index) => (
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
    </div>
  )
}

export { DocumentDetailContent }
