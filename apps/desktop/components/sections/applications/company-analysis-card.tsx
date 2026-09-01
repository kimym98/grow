"use client"

import type { CompanyAnalysis, CompanyApplication } from "@app/shared"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CompanyAnalysisCardProps {
  application: CompanyApplication
  analysis: CompanyAnalysis | null
  isTriggering: boolean
  canRetry: boolean
  onTrigger: () => void
}

function CompanyAnalysisCard({ application, analysis, isTriggering, canRetry, onTrigger }: CompanyAnalysisCardProps) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>기업 분석</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {application.companyName}에 대한 AI 기업 분석을 실행해 문화 적합성, 사업 도메인, 기술 스택,
            예상 질문을 확인해보세요.
          </p>
          <Button
            type="button"
            size="sm"
            className="self-start"
            disabled={!canRetry || isTriggering}
            onClick={onTrigger}
          >
            {isTriggering ? "분석 요청 중..." : "분석 실행"}
          </Button>
          {!canRetry ? (
            <p className="text-xs text-muted-foreground">
              등록된 AI API 키가 없어 분석을 실행할 수 없습니다. 설정에서 키를 등록해주세요.
            </p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  if (analysis.status === "completed") {
    const expectedQuestions = Array.isArray(analysis.expectedQuestions)
      ? (analysis.expectedQuestions as string[])
      : []

    return (
      <Card>
        <CardHeader>
          <CardTitle>기업 분석</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {analysis.summary ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">요약</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{analysis.summary}</p>
            </div>
          ) : null}
          {analysis.cultureFit ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">조직문화 적합성</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{analysis.cultureFit}</p>
            </div>
          ) : null}
          {analysis.businessDomain ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">사업 도메인</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{analysis.businessDomain}</p>
            </div>
          ) : null}
          {analysis.techStack ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">기술 스택</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{analysis.techStack}</p>
            </div>
          ) : null}
          {expectedQuestions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">예상 질문</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {expectedQuestions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="self-start"
            disabled={!canRetry || isTriggering}
            onClick={onTrigger}
          >
            {isTriggering ? "재분석 요청 중..." : "새로고침 재분석"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (analysis.status === "failed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>기업 분석</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            기업 분석에 실패했습니다{analysis.errorMessage ? `: ${analysis.errorMessage}` : "."}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="self-start"
            disabled={!canRetry || isTriggering}
            onClick={onTrigger}
          >
            {isTriggering ? "재시도 중..." : "다시 시도"}
          </Button>
          {!canRetry ? (
            <p className="text-xs text-muted-foreground">
              등록된 AI API 키가 없어 재시도할 수 없습니다. 설정에서 키를 등록해주세요.
            </p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기업 분석</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        분석이 진행 중입니다. 완료되면 자동으로 결과가 표시됩니다.
      </CardContent>
    </Card>
  )
}

export { CompanyAnalysisCard }
