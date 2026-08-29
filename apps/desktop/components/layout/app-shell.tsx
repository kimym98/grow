"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { SidebarMobile } from "@/components/layout/sidebar-mobile"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { CommandPalette } from "@/components/command-palette"
import { SITE_CONFIG } from "@/lib/constants"
import { useAuth } from "@/providers/auth-provider"
import { useCollectionRealtimeNotifications } from "@/lib/realtime-sync"
import { initSentryRenderer } from "@/lib/sentry"

/** 로그인 세션이 있을 때만 Realtime 구독을 마운트한다 (postgres_changes는 인증된 private 채널에서만 동작) */
function CollectionRealtimeNotifier() {
  useCollectionRealtimeNotifications()
  return null
}

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  // 프로덕션 export는 trailingSlash: true라 pathname이 "/login/"처럼 슬래시로
  // 끝난다. 정확히 비교하려면 끝 슬래시를 정규화해야 한다.
  const normalizedPathname =
    pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname
  const isAuthRoute = normalizedPathname === "/login"
  const { session } = useAuth()

  useEffect(() => {
    initSentryRenderer()
  }, [])

  if (isAuthRoute) {
    return (
      <div className="flex h-full">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {session && <CollectionRealtimeNotifier />}
      <CommandPalette />
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="md:hidden flex h-16 items-center justify-between border-b border-border/40 px-4">
          <SidebarMobile />
          <span className="font-bold text-lg">{SITE_CONFIG.name}</span>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
