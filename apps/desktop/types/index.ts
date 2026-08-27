export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  external?: boolean
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export type SortOrder = "asc" | "desc"

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface SiteConfig {
  name: string
  description: string
  url: string
}

export interface ElectronApi {
  ping: () => string
  onAuthCallback: (callback: (url: string) => void) => () => void
  /** 최신 일정 목록을 Electron 메인 프로세스에 동기화한다 (메인은 Supabase 인증 정보가 없어 렌더러가 push) */
  syncSchedules: (schedules: import("@app/shared").Schedule[]) => void
  /** 알림 설정 값을 Electron 메인 프로세스에 동기화한다 */
  syncNotificationSettings: (
    settings: import("@/lib/notification-settings").NotificationSettingsValue
  ) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronApi
  }
}
