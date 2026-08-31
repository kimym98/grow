"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Switch as SwitchPrimitive } from "radix-ui"
import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션 불일치 방지용 next-themes 표준 mounted 패턴
    setMounted(true)
  }, [])

  const isDark = mounted && theme === "dark"

  return (
    <SwitchPrimitive.Root
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      disabled={!mounted}
      aria-label="테마 전환"
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
        isDark ? "bg-zinc-900" : "bg-slate-200"
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none flex size-5 items-center justify-center rounded-full shadow-sm ring-0 transition-transform",
          isDark
            ? "translate-x-[22px] bg-orange-200"
            : "translate-x-0.5 bg-white"
        )}
      >
        {isDark ? (
          <Moon className="size-3 text-zinc-700" fill="currentColor" />
        ) : (
          <Sun className="size-3 text-amber-500" />
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}
