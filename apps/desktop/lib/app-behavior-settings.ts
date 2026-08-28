const STORAGE_KEY = "grow:app-behavior-settings"

export interface AppBehaviorSettingsValue {
  /** OS 로그인 시 앱 자동 실행 여부 */
  openAtLoginEnabled: boolean
  /** 창을 닫아도 트레이 아이콘으로 백그라운드에 남아있을지 여부 */
  keepInTrayEnabled: boolean
}

/**
 * 두 옵션 모두 기본값은 false다.
 * OS 로그인 시 상시 실행은 사용자 동의 없이 백그라운드 프로세스를 켜는 부수효과가 크고,
 * 트레이 유지는 기존 "창을 닫으면 앱이 종료되는" 동작을 그대로 보존하기 위함이다(docs/task015-research.md 참고)
 */
export const DEFAULT_APP_BEHAVIOR_SETTINGS: AppBehaviorSettingsValue = {
  openAtLoginEnabled: false,
  keepInTrayEnabled: false,
}

/** localStorage에 저장된 앱 동작 설정을 읽어온다. 서버 렌더링 환경이거나 저장된 값이 없으면 기본값을 반환한다 */
export function loadAppBehaviorSettings(): AppBehaviorSettingsValue {
  if (typeof window === "undefined") return DEFAULT_APP_BEHAVIOR_SETTINGS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APP_BEHAVIOR_SETTINGS
    return { ...DEFAULT_APP_BEHAVIOR_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_APP_BEHAVIOR_SETTINGS
  }
}

/** 앱 동작 설정을 localStorage에 저장한다 */
export function saveAppBehaviorSettings(settings: AppBehaviorSettingsValue): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
