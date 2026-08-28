"use client"

import { useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

/** 짧은 시간 안에 여러 건이 연속 INSERT되어도 알림을 한 번만 보내기 위한 디바운스 대기 시간(ms) */
const NOTIFY_DEBOUNCE_MS = 3000

/**
 * 지정한 테이블에 Realtime(postgres_changes INSERT) 구독을 등록하고,
 * 신규 레코드가 감지되면 짧은 시간 내 발생분을 모아 한 번의 OS 알림으로 보여준다.
 * private 채널(config.private=true)로 구독 시 이 프로젝트에서는 TIMED_OUT이 발생해(docs/task015-research.md 참고)
 * 공개 채널로 구독한다 — job_postings/tech_news의 SELECT RLS 정책이 이미 무조건 허용(qual=true)이라 안전하다.
 */
function useCollectionInsertNotification(table: "job_postings" | "tech_news", label: string) {
  const pendingCountRef = useRef(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`${table}-collection-notify`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        () => {
          pendingCountRef.current += 1

          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = setTimeout(() => {
            const count = pendingCountRef.current
            pendingCountRef.current = 0
            debounceTimerRef.current = null

            window.electronAPI?.showCollectionNotification(
              `새 ${label} ${count}건`,
              `${label}이(가) ${count}건 새로 수집되었습니다`
            )
          }, NOTIFY_DEBOUNCE_MS)
        }
      )
      .subscribe((status) => {
        console.log(`[realtime-sync] ${table} 채널 상태:`, status)
      })

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      supabase.removeChannel(channel)
      console.log(`[realtime-sync] ${table} 채널 구독 해제됨`)
    }
  }, [table, label])
}

/** job_postings/tech_news 수집 완료를 감지해 OS 알림으로 보여주는 Realtime 구독을 전역에서 마운트한다 */
export function useCollectionRealtimeNotifications() {
  useCollectionInsertNotification("job_postings", "공고")
  useCollectionInsertNotification("tech_news", "뉴스")
}
