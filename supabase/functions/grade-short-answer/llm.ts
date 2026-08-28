/**
 * grade-short-answer 전용 LLM 호출 로직 (Deno 네이티브)
 *
 * packages/shared/src/lib/llm/*.ts에 동일한 역할의 GeminiProvider/AnthropicProvider가 있지만,
 * 그 파일들은 확장자 없는 상대 임포트(Next.js bundler 모듈 해석 기준)로 작성되어 있어
 * 확장자를 반드시 명시해야 하는 Deno ESM 로더에서는 그대로 임포트할 수 없다
 * (docs/pdf-review-research.md 참고, review-document/llm.ts와 동일한 제약).
 * 따라서 이 함수 전용으로 동일한 fetchWithRetry/파싱 로직을 복제하고 프롬프트만 교체했다
 * — 프롬프트 문구를 바꿀 때는 review-document/llm.ts와 별개로 관리한다.
 */

export type LlmProviderName = "gemini" | "anthropic"

export interface ShortAnswerGradeResult {
  score: number
  feedback: string
}

// review-document/llm.ts와 동일한 값 — Gemini 3.6 계열 응답 지연 편차를 고려한 타임아웃
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

function parseJsonResponse(provider: string, rawText: string): ShortAnswerGradeResult {
  const start = rawText.indexOf("{")
  const end = rawText.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${provider} 응답에서 JSON을 찾을 수 없습니다: ${rawText}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText.slice(start, end + 1))
  } catch (error) {
    throw new Error(`${provider} 응답 JSON 파싱 실패: ${rawText} (${String(error)})`)
  }

  const { score, feedback } = parsed as { score?: unknown; feedback?: unknown }
  if (typeof score !== "number" || typeof feedback !== "string") {
    throw new Error(`${provider} 응답 형식이 올바르지 않습니다: ${rawText}`)
  }

  const clampedScore = Math.min(100, Math.max(0, Math.round(score)))
  return { score: clampedScore, feedback }
}

function buildGradingPrompt(input: { question: string; modelAnswer: string; userAnswer: string }): string {
  return `당신은 CS 기술 면접관입니다. 아래 문제와 모범 답안을 기준으로 지원자의 답변을 채점하세요.
0~100점 사이의 점수와, 부족한 부분·잘한 부분을 구체적으로 짚어주는 피드백을 작성하세요.

문제:
"""
${input.question}
"""

모범 답안:
"""
${input.modelAnswer}
"""

지원자 답변:
"""
${input.userAnswer}
"""

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"score": number, "feedback": string}`
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
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = await response.json()
  const text = data.content?.find((block: { type: string; text?: string }) => block.type === "text")?.text
  if (!text) throw new Error("anthropic 응답에 생성된 텍스트가 없습니다")
  return text
}

export async function gradeShortAnswer(
  provider: LlmProviderName,
  apiKey: string,
  input: { question: string; modelAnswer: string; userAnswer: string }
): Promise<ShortAnswerGradeResult> {
  const prompt = buildGradingPrompt(input)
  const rawText = provider === "gemini" ? await callGemini(apiKey, prompt) : await callAnthropic(apiKey, prompt)
  return parseJsonResponse(provider, rawText)
}
