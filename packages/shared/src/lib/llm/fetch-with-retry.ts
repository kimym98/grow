/**
 * LLM Provider REST 호출 공용 재시도/타임아웃 유틸
 * 재시도 2회(총 3회 시도), 요청당 타임아웃 60초
 * (Gemini 3.6 계열이 확장 사고 모드로 응답 지연 편차가 커서(실측 4~48초) 30초는 부족함을 확인함)
 */
const DEFAULT_TIMEOUT_MS = 60_000
const DEFAULT_RETRY_COUNT = 2

export class LlmProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = "LlmProviderError"
  }
}

export async function fetchWithRetry(
  provider: string,
  url: string,
  init: RequestInit,
  options: { timeoutMs?: number; retryCount?: number } = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT

  let lastError: unknown

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timer)

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        lastError = new LlmProviderError(
          `${provider} 응답 오류 (status: ${response.status}): ${errorBody}`,
          provider
        )
        // 429(rate limit)/5xx는 재시도, 4xx(요청 자체 오류)는 즉시 실패시킨다
        if (response.status < 500 && response.status !== 429) {
          throw lastError
        }
        continue
      }

      return response
    } catch (error) {
      clearTimeout(timer)
      if (error instanceof LlmProviderError) throw error

      lastError =
        error instanceof Error && error.name === "AbortError"
          ? new LlmProviderError(`${provider} 요청이 ${timeoutMs}ms 안에 응답하지 않았습니다`, provider, error)
          : new LlmProviderError(`${provider} 요청 실패: ${String(error)}`, provider, error)
    }
  }

  throw lastError instanceof Error ? lastError : new LlmProviderError(`${provider} 요청 실패`, provider, lastError)
}

/** 모델 응답에서 JSON 객체 부분만 안전하게 추출해 파싱한다 (모델이 JSON 외 텍스트를 덧붙이는 경우 대비) */
export function parseJsonResponse<T>(provider: string, rawText: string): T {
  const start = rawText.indexOf("{")
  const end = rawText.lastIndexOf("}")

  if (start === -1 || end === -1 || end < start) {
    throw new LlmProviderError(`${provider} 응답에서 JSON을 찾을 수 없습니다: ${rawText}`, provider)
  }

  try {
    return JSON.parse(rawText.slice(start, end + 1)) as T
  } catch (error) {
    throw new LlmProviderError(`${provider} 응답 JSON 파싱 실패: ${rawText}`, provider, error)
  }
}
