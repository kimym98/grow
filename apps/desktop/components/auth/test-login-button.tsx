"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FlaskConical, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { signInAsTestAccount } from "@/lib/auth-test"

/**
 * 개발 환경 전용 테스트 계정 로그인 버튼.
 * Google OAuth(딥링크) 없이 Playwright MCP/수동 QA에서 인증이 필요한 화면을 바로 검증하기 위한 용도.
 * 프로덕션 빌드(next build → NODE_ENV=production)에서는 렌더링되지 않는다.
 */
function TestLoginButton() {
  const [isLoading, setIsLoading] = useState(false)

  if (process.env.NODE_ENV === "production") return null

  async function handleClick() {
    setIsLoading(true)
    try {
      await signInAsTestAccount()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "테스트 계정 로그인에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="lg"
      className="w-full"
      disabled={isLoading}
      onClick={handleClick}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
      테스트 계정으로 로그인 (개발용)
    </Button>
  )
}

export { TestLoginButton }
