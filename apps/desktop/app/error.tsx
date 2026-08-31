"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-6 space-y-4">
      <p className="text-destructive">문제가 발생했습니다.</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  )
}
