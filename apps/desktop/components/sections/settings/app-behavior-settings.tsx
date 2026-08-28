"use client"

import { useEffect, useState } from "react"
import { MonitorCog } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  loadAppBehaviorSettings,
  saveAppBehaviorSettings,
  type AppBehaviorSettingsValue,
} from "@/lib/app-behavior-settings"

function AppBehaviorSettings() {
  const [settings, setSettings] = useState<AppBehaviorSettingsValue>(loadAppBehaviorSettings)
  const { openAtLoginEnabled, keepInTrayEnabled } = settings

  useEffect(() => {
    saveAppBehaviorSettings(settings)
    window.electronAPI?.setLoginItemEnabled(settings.openAtLoginEnabled)
    window.electronAPI?.setTrayEnabled(settings.keepInTrayEnabled)
  }, [settings])

  function setOpenAtLoginEnabled(value: boolean) {
    setSettings((prev) => ({ ...prev, openAtLoginEnabled: value }))
  }

  function setKeepInTrayEnabled(value: boolean) {
    setSettings((prev) => ({ ...prev, keepInTrayEnabled: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MonitorCog className="size-4 text-primary" />
          앱 실행 설정
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="open-at-login-enabled">OS 로그인 시 자동 실행</Label>
            <p className="text-xs text-muted-foreground">
              컴퓨터에 로그인하면 앱이 자동으로 실행됩니다
            </p>
          </div>
          <Switch
            id="open-at-login-enabled"
            checked={openAtLoginEnabled}
            onCheckedChange={setOpenAtLoginEnabled}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="keep-in-tray-enabled">창을 닫아도 백그라운드 유지</Label>
            <p className="text-xs text-muted-foreground">
              창을 닫아도 앱이 종료되지 않고 트레이 아이콘으로 남습니다. 완전히 종료하려면
              트레이 메뉴에서 &quot;종료&quot;를 선택하세요. 앱이 완전히 종료된 상태에서는 알림이
              발송되지 않습니다.
            </p>
          </div>
          <Switch
            id="keep-in-tray-enabled"
            checked={keepInTrayEnabled}
            onCheckedChange={setKeepInTrayEnabled}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export { AppBehaviorSettings }
