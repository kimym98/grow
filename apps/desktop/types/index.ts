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
  /** Supabase Realtime으로 감지한 신규 공고/뉴스 수집 완료를 OS 알림으로 표시하도록 요청한다 */
  showCollectionNotification: (title: string, body: string) => void
  /** OS 로그인 시 앱을 자동 실행할지 설정한다 */
  setLoginItemEnabled: (enabled: boolean) => void
  /** 현재 OS 로그인 자동 실행 설정 여부를 조회한다 */
  getLoginItemEnabled: () => Promise<boolean>
  /** 창을 닫아도 트레이 아이콘으로 백그라운드에 남아있을지 설정한다 */
  setTrayEnabled: (enabled: boolean) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronApi
  }
}
