"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS, SITE_CONFIG } from "@/lib/constants"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserProfile } from "@/components/layout/user-profile"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/40 bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-bold text-lg">
          {SITE_CONFIG.name}
        </Link>
        <ThemeToggle />
      </div>

      <div className="border-b border-border/40 p-2">
        <UserProfile />
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
