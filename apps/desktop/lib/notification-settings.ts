const STORAGE_KEY = "grow:notification-settings"

export interface NotificationSettingsValue {
  dailySummaryEnabled: boolean
  dailySummaryTime: string
  scheduledAlertEnabled: boolean
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsValue = {
  dailySummaryEnabled: true,
  dailySummaryTime: "09:00",
  scheduledAlertEnabled: true,
}

/** localStorage에 저장된 알림 설정을 읽어온다. 서버 렌더링 환경이거나 저장된 값이 없으면 기본값을 반환한다 */
export function loadNotificationSettings(): NotificationSettingsValue {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

/** 알림 설정을 localStorage에 저장한다 */
export function saveNotificationSettings(settings: NotificationSettingsValue): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
