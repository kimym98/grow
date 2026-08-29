"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
      })
      .catch((error) => {
        console.error("세션 조회 실패:", error)
        setSession(null)
      })
      .finally(() => {
        setIsLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
      }
    )

    const unsubscribeAuthCallback = window.electronAPI?.onAuthCallback(
      async (url) => {
        const parsed = new URL(url)
        const code = parsed.searchParams.get("code")
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
          return
        }

        // signInWithOAuth 기본(암묵적) 플로우는 grow://auth/callback#access_token=...
        // 처럼 code가 아니라 해시 프래그먼트로 토큰을 전달한다.
        const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        }
      }
    )

    return () => {
      subscription.subscription.unsubscribe()
      unsubscribeAuthCallback?.()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다")
  }
  return context
}
