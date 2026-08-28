/**
 * review-document 전용 LLM 호출 로직 (Deno 네이티브)
 *
 * packages/shared/src/lib/llm/*.ts에 동일한 역할의 GeminiProvider/AnthropicProvider가 있지만,
 * 그 파일들은 확장자 없는 상대 임포트(Next.js bundler 모듈 해석 기준)로 작성되어 있어
 * 확장자를 반드시 명시해야 하는 Deno ESM 로더에서는 그대로 임포트할 수 없다
 * (docs/pdf-review-research.md 참고). 따라서 이 함수 전용으로 동일한 프롬프트/파싱 로직을
 * Deno 규칙에 맞게 이식했다 — 프롬프트 문구를 바꿀 때는 두 파일을 함께 수정해야 한다.
 */

export type LlmProviderName = "gemini" | "anthropic"

export interface DocumentReviewResult {
  reviewedText: string
  comments: Array<{ quote: string; comment: string }>
}

// Gemini 3.6 계열은 확장 사고(thinking) 모드로 인해 응답 지연 편차가 커서(로컬 실측 4~48초)
// 30초는 실제로 자주 타임아웃되는 것을 확인함 -> 여유를 두고 60초로 설정
const TIMEOUT_MS = 60_000
const RETRY_COUNT = 2

async function fetchWithRetry(provider: string, url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timer)

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        lastError = new Error(`${provider} 응답 오류 (status: ${response.status}): ${body}`)
        if (response.status < 500 && response.status !== 429) throw lastError
        continue
      }

      return response
    } catch (error) {
      clearTimeout(timer)
      if (error instanceof Error && error.message.startsWith(`${provider} 응답 오류`)) throw error

      lastError =
        error instanceof Error && error.name === "AbortError"
          ? new Error(`${provider} 요청이 ${TIMEOUT_MS}ms 안에 응답하지 않았습니다`)
          : new Error(`${provider} 요청 실패: ${String(error)}`)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${provider} 요청 실패`)
}

function parseJsonResponse(provider: string, rawText: string): DocumentReviewResult {
  const start = rawText.indexOf("{")
  const end = rawText.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${provider} 응답에서 JSON을 찾을 수 없습니다: ${rawText}`)
  }

  try {
    return JSON.parse(rawText.slice(start, end + 1)) as DocumentReviewResult
  } catch (error) {
    throw new Error(`${provider} 응답 JSON 파싱 실패: ${rawText} (${String(error)})`)
  }
}

function buildDocumentReviewPrompt(input: {
  text: string
  documentType: "resume" | "portfolio"
  resumeQuestion?: string
}): string {
  const documentTypeLabel = input.documentType === "resume" ? "자기소개서" : "포트폴리오"
  const questionLine = input.resumeQuestion ? `\n문항: ${input.resumeQuestion}` : ""

  return `당신은 신입/주니어 개발자 취업을 돕는 ${documentTypeLabel} 첨삭 전문가입니다.
아래 원문을 읽고 더 설득력 있고 구체적으로 다듬은 전체 첨삭본을 작성하세요.
그리고 원문에서 개선이 필요한 부분을 직접 인용(quote)하고, 왜 고쳐야 하는지 코멘트를 남기세요.${questionLine}

원문:
"""
${input.text}
"""

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"reviewedText": string, "comments": [{"quote": string, "comment": string}]}`
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`

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

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const response = await fetchWithRetry("anthropic", "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = await response.json()
  const text = data.content?.find((block: { type: string; text?: string }) => block.type === "text")?.text
  if (!text) throw new Error("anthropic 응답에 생성된 텍스트가 없습니다")
  return text
}

export async function generateDocumentReview(
  provider: LlmProviderName,
  apiKey: string,
  input: { text: string; documentType: "resume" | "portfolio"; resumeQuestion?: string }
): Promise<DocumentReviewResult> {
  const prompt = buildDocumentReviewPrompt(input)
  const rawText = provider === "gemini" ? await callGemini(apiKey, prompt) : await callAnthropic(apiKey, prompt)
  return parseJsonResponse(provider, rawText)
}
