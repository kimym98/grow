"use client"

import { useEffect, useState } from "react"
import { BellRing } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  loadNotificationSettings,
  saveNotificationSettings,
  type NotificationSettingsValue,
} from "@/lib/notification-settings"

function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsValue>(loadNotificationSettings)
  const { dailySummaryEnabled, dailySummaryTime, scheduledAlertEnabled } = settings

  useEffect(() => {
    saveNotificationSettings(settings)
    window.electronAPI?.syncNotificationSettings(settings)
  }, [settings])

  function setDailySummaryEnabled(value: boolean) {
    setSettings((prev) => ({ ...prev, dailySummaryEnabled: value }))
  }

  function setDailySummaryTime(value: string) {
    setSettings((prev) => ({ ...prev, dailySummaryTime: value }))
  }

  function setScheduledAlertEnabled(value: boolean) {
    setSettings((prev) => ({ ...prev, scheduledAlertEnabled: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BellRing className="size-4 text-primary" />
          알림 설정
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="daily-summary-enabled">당일 요약 알림</Label>
            <p className="text-xs text-muted-foreground">
              매일 지정 시각에 오늘 일정 요약을 알려줍니다
            </p>
          </div>
          <Switch
            id="daily-summary-enabled"
            checked={dailySummaryEnabled}
            onCheckedChange={setDailySummaryEnabled}
          />
        </div>

        <Input
          type="time"
          aria-label="당일 요약 알림 시각"
          value={dailySummaryTime}
          onChange={(event) => setDailySummaryTime(event.target.value)}
          disabled={!dailySummaryEnabled}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="scheduled-alert-enabled">지정 시각 알림</Label>
            <p className="text-xs text-muted-foreground">
              일정별로 설정한 알림 시각에 개별 알림을 보냅니다
            </p>
          </div>
          <Switch
            id="scheduled-alert-enabled"
            checked={scheduledAlertEnabled}
            onCheckedChange={setScheduledAlertEnabled}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export { NotificationSettings }
