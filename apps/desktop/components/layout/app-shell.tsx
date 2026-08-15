"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { SidebarMobile } from "@/components/layout/sidebar-mobile"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { SITE_CONFIG } from "@/lib/constants"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthRoute = pathname === "/login"

  if (isAuthRoute) {
    return (
      <div className="flex h-full">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="md:hidden flex h-16 items-center justify-between border-b border-border/40 px-4">
          <SidebarMobile />
          <span className="font-bold text-lg">{SITE_CONFIG.name}</span>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
