/**
 * review-document / grade-short-answer 공용 LLM 호출 유틸 (Deno 네이티브)
 *
 * fetchWithRetry(재시도/타임아웃), JSON 응답 추출, Gemini/Anthropic REST 호출 골격을
 * 이 파일 하나로 통합한다. score/feedback 검증 같은 도메인별 로직은 각 함수의
 * llm.ts에 남겨두고, 이 파일은 provider 응답 텍스트를 얻어오는 것까지만 책임진다.
 *
 * 참고: packages/shared/src/lib/llm/fetch-with-retry.ts에 동일 역할의 Node/Next.js용
 * 구현이 있다(런타임이 달라 별도 유지). 재시도/타임아웃 정책을 바꿀 때는 두 파일을 함께 검토할 것.
 */

// Gemini 3.6 계열은 확장 사고(thinking) 모드로 인해 응답 지연 편차가 커서(로컬 실측 4~48초)
// 30초는 실제로 자주 타임아웃되는 것을 확인함 -> 여유를 두고 60초로 설정
const DEFAULT_TIMEOUT_MS = 60_000
const DEFAULT_RETRY_COUNT = 2
// 전체 시도 누적 시간 상한. 개별 타임아웃(60초) x 재시도(최대 3회)가 그대로 누적되면
// 최대 180초까지 걸릴 수 있어, 예산을 넘기면 즉시 중단하도록 한다 (Task 026)
const DEFAULT_TOTAL_BUDGET_MS = 90_000

export interface FetchWithRetryOptions {
  timeoutMs?: number
  retryCount?: number
  totalBudgetMs?: number
}

export async function fetchWithRetry(
  provider: string,
  url: string,
  init: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT
  const totalBudgetMs = options.totalBudgetMs ?? DEFAULT_TOTAL_BUDGET_MS

  const startedAt = Date.now()
  let lastError: unknown

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const remainingBudgetMs = totalBudgetMs - (Date.now() - startedAt)
    if (remainingBudgetMs <= 0) break

    const perAttemptTimeoutMs = Math.min(timeoutMs, remainingBudgetMs)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), perAttemptTimeoutMs)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timer)

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        lastError = new Error(`${provider} 응답 오류 (status: ${response.status}): ${body}`)
        // 429(rate limit)/5xx는 재시도, 4xx(요청 자체 오류)는 즉시 실패시킨다
        if (response.status < 500 && response.status !== 429) throw lastError
        continue
      }

      return response
    } catch (error) {
      clearTimeout(timer)
      if (error instanceof Error && error.message.startsWith(`${provider} 응답 오류`)) throw error

      lastError =
        error instanceof Error && error.name === "AbortError"
          ? new Error(`${provider} 요청이 ${perAttemptTimeoutMs}ms 안에 응답하지 않았습니다`)
          : new Error(`${provider} 요청 실패: ${String(error)}`)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${provider} 요청이 전체 예산(${totalBudgetMs}ms) 내에 완료되지 않았습니다`)
}

/** 모델 응답에서 JSON 객체 부분만 안전하게 추출해 파싱한다 (모델이 JSON 외 텍스트를 덧붙이는 경우 대비) */
export function extractJsonObject<T>(provider: string, rawText: string): T {
  const start = rawText.indexOf("{")
  const end = rawText.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${provider} 응답에서 JSON을 찾을 수 없습니다: ${rawText}`)
  }

  try {
    return JSON.parse(rawText.slice(start, end + 1)) as T
  } catch (error) {
    throw new Error(`${provider} 응답 JSON 파싱 실패: ${rawText} (${String(error)})`)
  }
}

export interface GeminiCallOptions {
  model?: string
}

export async function callGeminiJson(apiKey: string, prompt: string, options: GeminiCallOptions = {}): Promise<string> {
  const model = options.model ?? "gemini-3.6-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetchWithRetry("gemini", url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  })

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("gemini 응답에 생성된 텍스트가 없습니다")
  return text
}

export interface AnthropicCallOptions {
  model?: string
  maxTokens: number
}

export async function callAnthropicJson(apiKey: string, prompt: string, options: AnthropicCallOptions): Promise<string> {
  const model = options.model ?? "claude-sonnet-4-5"

  const response = await fetchWithRetry("anthropic", "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = await response.json()
  const text = data.content?.find((block: { type: string; text?: string }) => block.type === "text")?.text
  if (!text) throw new Error("anthropic 응답에 생성된 텍스트가 없습니다")
  return text
}
