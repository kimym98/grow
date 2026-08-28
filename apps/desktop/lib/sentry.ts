/**
 * 렌더러(Next.js 앱) 프로세스의 Sentry 초기화.
 * NEXT_PUBLIC_SENTRY_DSN이 설정되지 않으면 완전히 no-op으로 동작한다(빌드 시점에 값이 없으면
 * 클라이언트 번들에도 포함되지 않으므로 이 환경처럼 DSN이 없는 배포에서는 아무 코드도 실행되지 않는다).
 * electron/main.ts의 initSentryIfConfigured, electron/preload.ts의 IPC 브리지와 짝을 이룬다.
 */
let initialized = false

export function initSentryRenderer(): void {
  if (initialized) return
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  initialized = true

  import("@sentry/electron/renderer")
    .then(({ init }) => init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN }))
    .catch((error) => {
      console.error("[sentry] 렌더러 초기화 실패(앱 실행에는 영향 없음):", error)
    })
}
