/**
 * 크롤링 요청 공통 정책 유틸 (Task 024)
 * 소스별 요청 사이 딜레이(delay)와 실패 시 지수 백오프 재시도(fetchWithBackoff)를 제공한다.
 * collect-job-postings, collect-tech-news의 모든 소스 어댑터 및 오케스트레이션 러너가 공유한다.
 */

/** 429/403/5xx만 재시도 대상으로 삼는다. 404 등 명백한 클라이언트 오류는 재시도해도 성공할 수 없으므로 제외한다 */
const RETRYABLE_STATUS = [403, 429, 500, 502, 503, 504]

/** 최대 재시도 횟수(최초 시도 제외). 3회면 총 4번 시도 */
const MAX_RETRIES = 3

/** 지수 백오프 초기 대기 시간(ms). 500ms → 1000ms → 2000ms로 증가 */
const BASE_DELAY_MS = 500

/**
 * 재시도 전체에 허용하는 시간 예산(ms). Edge Function 실행시간 제한 내에서
 * 한 소스가 재시도로 지나치게 오래 붙잡고 있지 않도록 상한을 둔다.
 */
const RETRY_BUDGET_MS = 15000

export interface FetchWithBackoffConfig {
  retryableStatus?: number[]
  maxRetries?: number
  baseDelayMs?: number
  retryBudgetMs?: number
}

/** 지정한 시간(ms)만큼 대기한다 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * fetch를 감싸 429/403/5xx 응답이나 네트워크 예외 발생 시 지수 백오프로 재시도한다.
 * 재시도 대상이 아닌 상태 코드(404 등)는 재시도 없이 그대로 Response를 반환하므로,
 * 호출부는 기존과 동일하게 `if (!response.ok) throw ...` 패턴을 유지하면 된다.
 */
export async function fetchWithBackoff(
  url: string,
  options?: RequestInit,
  config?: FetchWithBackoffConfig,
): Promise<Response> {
  const retryableStatus = config?.retryableStatus ?? RETRYABLE_STATUS
  const maxRetries = config?.maxRetries ?? MAX_RETRIES
  const baseDelayMs = config?.baseDelayMs ?? BASE_DELAY_MS
  const retryBudgetMs = config?.retryBudgetMs ?? RETRY_BUDGET_MS

  const startedAt = performance.now()
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (performance.now() - startedAt > retryBudgetMs) break

    try {
      const response = await fetch(url, options)
      if (response.ok || !retryableStatus.includes(response.status)) {
        return response
      }
      lastError = new Error(`${response.status} ${response.statusText}`)
    } catch (error) {
      lastError = error
    }

    if (attempt < maxRetries) {
      await delay(baseDelayMs * 2 ** attempt)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
