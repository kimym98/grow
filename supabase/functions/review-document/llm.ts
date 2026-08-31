/**
 * review-document 전용 LLM 호출 로직 (Deno 네이티브)
 *
 * fetchWithRetry/JSON 추출/Gemini·Anthropic REST 호출 공용 골격은
 * supabase/functions/_shared/llm-client.ts로 통합되어 있다.
 * 이 파일에는 문서 첨삭 프롬프트(DOCUMENT_REVIEW_PROMPT_TEMPLATE/buildDocumentReviewPrompt)와 provider 분기만 남긴다
 * — 프롬프트 문구를 바꿀 때는 packages/shared/src/lib/llm/prompt-templates.ts의 buildDocumentReviewPrompt
 * (동일 문자열, Node/Next.js용)도 함께 확인한다. 두 곳 모두 동일 문구를 유지해야 캐시 해시와 실제 호출 결과가
 * 일관된다(완전한 단일 소스화는 Task 025에서 Deno 번들 크기 문제로 보류됨).
 */

import { callAnthropicJson, callGeminiJson, extractJsonObject } from "../_shared/llm-client.ts"

export type LlmProviderName = "gemini" | "anthropic"

export interface DocumentReviewResult {
  reviewedText: string
  comments: Array<{ quote: string; comment: string }>
}

const ANTHROPIC_MAX_TOKENS = 4096

// 사용자 입력(문서 타입 라벨/문항 라인/원문)이 보간되지 않는 고정 골격만 담은 템플릿. 이 문자열의 해시가
// LLM 응답 캐시 키에 포함되어 프롬프트 문구가 바뀌면 자동으로 캐시가 무효화된다 (index.ts의 hashPromptTemplate 참고).
// 문서 타입/문항 유무는 이미 cacheKey의 review.type, review.resume_question 필드로 구분되므로 이 템플릿에는 넣지 않는다
export const DOCUMENT_REVIEW_PROMPT_TEMPLATE = `당신은 신입/주니어 개발자 취업을 돕는 {{DOCUMENT_TYPE_LABEL}} 첨삭 전문가입니다.
아래 원문을 읽고 더 설득력 있고 구체적으로 다듬은 전체 첨삭본을 작성하세요.
그리고 원문에서 개선이 필요한 부분을 직접 인용(quote)하고, 왜 고쳐야 하는지 코멘트를 남기세요.{{QUESTION_LINE}}

원문:
"""
{{TEXT}}
"""

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"reviewedText": string, "comments": [{"quote": string, "comment": string}]}`

function buildDocumentReviewPrompt(input: {
  text: string
  documentType: "resume" | "portfolio"
  resumeQuestion?: string
}): string {
  const documentTypeLabel = input.documentType === "resume" ? "자기소개서" : "포트폴리오"
  const questionLine = input.resumeQuestion ? `\n문항: ${input.resumeQuestion}` : ""

  return DOCUMENT_REVIEW_PROMPT_TEMPLATE.replace("{{DOCUMENT_TYPE_LABEL}}", documentTypeLabel)
    .replace("{{QUESTION_LINE}}", questionLine)
    .replace("{{TEXT}}", input.text)
}

export async function generateDocumentReview(
  provider: LlmProviderName,
  apiKey: string,
  input: { text: string; documentType: "resume" | "portfolio"; resumeQuestion?: string }
): Promise<DocumentReviewResult> {
  const prompt = buildDocumentReviewPrompt(input)
  const rawText =
    provider === "gemini"
      ? await callGeminiJson(apiKey, prompt)
      : await callAnthropicJson(apiKey, prompt, { maxTokens: ANTHROPIC_MAX_TOKENS })
  return extractJsonObject<DocumentReviewResult>(provider, rawText)
}
