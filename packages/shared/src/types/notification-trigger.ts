import type { Schedule } from "./schedule"

/**
 * Electron 네이티브 알림(및 향후 모바일 Push) 발송 여부를 판단하는 플랫폼 독립 인터페이스
 * 실제 구현체는 Task 011에서 packages/shared에 작성하며, 여기서는 시그니처만 선언한다
 */
export interface NotificationTrigger {
  shouldTriggerReminder(schedule: Schedule, now: Date): boolean
  shouldTriggerDailySummary(now: Date, lastSummaryAt?: Date): boolean
}
