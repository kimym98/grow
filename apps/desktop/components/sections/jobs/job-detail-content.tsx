"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import type { JobPosting } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createSchedule } from "@/lib/schedules"
import { useRecentFavoritesStore } from "@/lib/stores/recent-favorites-store"

interface JobDetailContentProps {
  job: JobPosting
}

/** 마감일까지 남은 일수를 계산한다 (오늘 자정 기준). 마감일이 없으면(상시채용) null 반환 */
function getDDay(deadline: string | null) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

function JobDetailContent({ job }: JobDetailContentProps) {
  const dDay = getDDay(job.deadline)
  const dDayLabel = dDay === null ? "상시채용" : dDay < 0 ? "마감" : dDay === 0 ? "D-Day" : `D-${dDay}`
  const [isSubmitting, setIsSubmitting] = useState(false)
  const addRecent = useRecentFavoritesStore((state) => state.addRecent)

  useEffect(() => {
    addRecent({
      key: `job:${job.id}`,
      type: "job",
      id: job.id,
      title: job.title,
      subtitle: job.company,
      href: `/jobs?id=${job.id}`,
    })
  }, [addRecent, job.id, job.title, job.company])

  async function handleAddToSchedule() {
    if (!job.deadline) return

    setIsSubmitting(true)
    try {
      await createSchedule({
        title: `[마감] ${job.title}`,
        date: job.deadline,
        category: "deadline",
        isRecurring: false,
        checklist: [],
      })
      toast.success("일정에 추가되었습니다")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "일정 추가에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Badge variant={dDay !== null && dDay <= 3 ? "destructive" : "outline"}>{dDayLabel}</Badge>
        <h1 className="text-2xl font-semibold">{job.title}</h1>
        <p className="text-sm text-muted-foreground">
          {job.company} · {job.location} · {job.careerLevel} · {job.source}
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
        마감일: <span className="text-foreground">{job.deadline ?? "상시채용"}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={job.url} target="_blank" rel="noopener noreferrer">
            원본 공고 보기
          </Link>
        </Button>
        <Button
          onClick={handleAddToSchedule}
          disabled={!job.deadline || isSubmitting}
          title={job.deadline ? undefined : "마감일이 없는 공고입니다"}
        >
          일정에 추가
        </Button>
      </div>
    </div>
  )
}

export { JobDetailContent }
