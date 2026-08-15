import Link from "next/link"
import type { JobPostingFixture } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface JobDetailContentProps {
  job: JobPostingFixture
}

/** 마감일까지 남은 일수를 계산한다 (오늘 자정 기준) */
function getDDay(deadline: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

function JobDetailContent({ job }: JobDetailContentProps) {
  const dDay = getDDay(job.deadline)
  const dDayLabel = dDay < 0 ? "마감" : dDay === 0 ? "D-Day" : `D-${dDay}`

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Badge variant={dDay <= 3 ? "destructive" : "outline"}>{dDayLabel}</Badge>
        <h1 className="text-2xl font-semibold">{job.title}</h1>
        <p className="text-sm text-muted-foreground">
          {job.company} · {job.location} · {job.careerLevel}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        마감일: <span className="text-foreground">{job.deadline}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={job.url} target="_blank" rel="noopener noreferrer">
            원본 공고 보기
          </Link>
        </Button>
        <Button disabled title="준비 중인 기능입니다">
          일정에 추가
        </Button>
      </div>
    </div>
  )
}

export { JobDetailContent }
