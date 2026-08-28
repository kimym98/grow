import { beforeEach, describe, expect, it } from "vitest"

import {
  DEFAULT_APP_BEHAVIOR_SETTINGS,
  loadAppBehaviorSettings,
  saveAppBehaviorSettings,
} from "@/lib/app-behavior-settings"

describe("app-behavior-settings", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("저장된 값이 없으면 기본값(둘 다 false)을 반환한다", () => {
    expect(loadAppBehaviorSettings()).toEqual(DEFAULT_APP_BEHAVIOR_SETTINGS)
  })

  it("저장한 값을 그대로 읽어온다", () => {
    saveAppBehaviorSettings({ openAtLoginEnabled: true, keepInTrayEnabled: false })

    expect(loadAppBehaviorSettings()).toEqual({
      openAtLoginEnabled: true,
      keepInTrayEnabled: false,
    })
  })

  it("localStorage에 손상된 JSON이 있으면 기본값으로 안전하게 폴백한다", () => {
    window.localStorage.setItem("grow:app-behavior-settings", "{invalid-json")

    expect(loadAppBehaviorSettings()).toEqual(DEFAULT_APP_BEHAVIOR_SETTINGS)
  })
})
