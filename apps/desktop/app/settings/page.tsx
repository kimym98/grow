"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LlmKeySettings } from "@/components/sections/settings/llm-key-settings"
import { AutoUpdateInfo } from "@/components/sections/settings/auto-update-info"
import { AppBehaviorSettings } from "@/components/sections/settings/app-behavior-settings"
import { useAuth } from "@/providers/auth-provider"

export default function SettingsPage() {
  const router = useRouter()
  const { signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    router.replace("/login")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">설정</h1>
        <p className="text-muted-foreground mt-2">
          계정 및 알림 설정이 여기에 표시됩니다.
        </p>
      </div>

      <LlmKeySettings />

      <AutoUpdateInfo />

      <AppBehaviorSettings />

      <Button variant="destructive" className="w-fit" onClick={handleLogout}>
        <LogOut />
        로그아웃
      </Button>
    </div>
  )
}
