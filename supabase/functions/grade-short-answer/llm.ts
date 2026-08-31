/**
 * grade-short-answer 전용 LLM 호출 로직 (Deno 네이티브)
 *
 * fetchWithRetry/JSON 추출/Gemini·Anthropic REST 호출 공용 골격은
 * supabase/functions/_shared/llm-client.ts로 통합되어 있다.
 * 이 파일에는 채점 프롬프트(buildGradingPrompt)와 score/feedback 검증·clamp 로직만 남긴다.
 */

import { callAnthropicJson, callGeminiJson, extractJsonObject } from "../_shared/llm-client.ts"

export type LlmProviderName = "gemini" | "anthropic"

export interface ShortAnswerGradeResult {
  score: number
  feedback: string
}

const ANTHROPIC_MAX_TOKENS = 1024

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

function validateGradeResult(provider: string, parsed: unknown, rawText: string): ShortAnswerGradeResult {
  const { score, feedback } = parsed as { score?: unknown; feedback?: unknown }
  if (typeof score !== "number" || typeof feedback !== "string") {
    throw new Error(`${provider} 응답 형식이 올바르지 않습니다: ${rawText}`)
  }

  const clampedScore = Math.min(100, Math.max(0, Math.round(score)))
  return { score: clampedScore, feedback }
}

export async function gradeShortAnswer(
  provider: LlmProviderName,
  apiKey: string,
  input: { question: string; modelAnswer: string; userAnswer: string }
): Promise<ShortAnswerGradeResult> {
  const prompt = buildGradingPrompt(input)
  const rawText =
    provider === "gemini"
      ? await callGeminiJson(apiKey, prompt)
      : await callAnthropicJson(apiKey, prompt, { maxTokens: ANTHROPIC_MAX_TOKENS })
  const parsed = extractJsonObject<unknown>(provider, rawText)
  return validateGradeResult(provider, parsed, rawText)
}
