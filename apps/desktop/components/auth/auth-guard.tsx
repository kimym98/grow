"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LoadingState } from "@/components/common/loading-state"
import { useAuth } from "@/providers/auth-provider"

const PUBLIC_ROUTES = ["/login"]

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    if (isLoading) return

    if (!session && !isPublicRoute) {
      router.replace("/login")
      return
    }

    if (session && isPublicRoute) {
      router.replace("/")
    }
  }, [isLoading, session, isPublicRoute, router])

  if (isPublicRoute) {
    return children
  }

  if (isLoading || !session) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingState variant="detail" />
      </div>
    )
  }

  return children
}
