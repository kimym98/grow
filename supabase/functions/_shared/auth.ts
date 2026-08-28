/**
 * 사용자 JWT 인증이 필요한 Edge Function 공용 헬퍼
 * withSupabase({ auth: ["user"] })와 함께 사용한다.
 * (docs/pdf-review-research.md 조사 결과 반영 — review-document가 이 저장소 최초의 auth:"user" 함수)
 */

interface ErrorBody {
  error: string
  message: string
}

/** 일관된 형식(error 코드 + message)의 JSON 에러 응답을 만든다 */
export function jsonError(code: string, message: string, status: number): Response {
  return Response.json({ error: code, message } satisfies ErrorBody, { status })
}

export class AuthRequiredError extends Error {
  constructor() {
    super("인증이 필요합니다")
    this.name = "AuthRequiredError"
  }
}

/** ctx.userClaims에서 요청자의 auth.uid()를 꺼낸다. 없으면 AuthRequiredError를 던진다 */
export function requireUserId(userClaims: { id?: string } | null | undefined): string {
  if (!userClaims?.id) {
    throw new AuthRequiredError()
  }
  return userClaims.id
}
