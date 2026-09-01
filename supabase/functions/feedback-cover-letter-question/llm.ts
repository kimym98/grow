/**
 * feedback-cover-letter-question 전용 LLM 호출 로직 (Deno 네이티브)
 *
 * fetchWithRetry/JSON 추출/Gemini·Anthropic REST 호출 공용 골격은
 * supabase/functions/_shared/llm-client.ts로 통합되어 있다.
 * 이 파일에는 자소서 문항 첨삭 프롬프트(FEEDBACK_PROMPT_TEMPLATE/buildFeedbackPrompt)와
 * provider 분기만 남긴다 — analyze-company/llm.ts와 동일 패턴을 준용한다.
 *
 * 핵심: "일반 첨삭"이 아니라 company_analyses 결과(요약/컬처핏/사업영역/기술스택)를
 * 컨텍스트로 주입해 "그 기업에 맞춘" 첨삭을 만드는 것이 이 함수의 목적이다.
 */

import { callAnthropicJson, callGeminiJson, extractJsonObject } from "../_shared/llm-client.ts"

export type LlmProviderName = "gemini" | "anthropic"

export interface CoverLetterFeedbackResult {
  feedbackText: string
}

const ANTHROPIC_MAX_TOKENS = 4096

// 사용자 입력(문항/답변/기업 분석 컨텍스트)이 보간되지 않는 고정 골격만 담은 템플릿.
// 이 문자열의 해시가 LLM 응답 캐시 키에 포함되어 프롬프트 문구가 바뀌면 자동으로 캐시가 무효화된다
// (index.ts의 hashPromptTemplate 참고).
export const FEEDBACK_PROMPT_TEMPLATE = `당신은 신입/주니어 개발자의 자기소개서 작성을 돕는 첨삭 전문가입니다.
아래 지원 기업 분석 결과를 반드시 참고하여, 일반적인 첨삭이 아니라 "이 기업에 맞춘" 구체적인 첨삭을 작성하세요.
지원자의 답변이 기업의 컬처핏/사업영역/기술스택과 얼마나 부합하는지, 어떻게 하면 더 부합하게 다듬을 수 있는지에 집중하세요.

[지원 기업 분석]
요약: {{ANALYSIS_SUMMARY}}
컬처핏: {{ANALYSIS_CULTURE_FIT}}
사업영역: {{ANALYSIS_BUSINESS_DOMAIN}}
기술스택: {{ANALYSIS_TECH_STACK}}

[자소서 문항]
{{QUESTION_TEXT}}
글자수 제한: {{CHAR_LIMIT}}

[지원자 답변]
{{ANSWER_TEXT}}

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"feedbackText": string}`

function buildFeedbackPrompt(input: {
  questionText: string
  answerText: string
  charLimit: number | null
  analysisSummary: string
  analysisCultureFit: string
  analysisBusinessDomain: string
  analysisTechStack: string
}): string {
  return FEEDBACK_PROMPT_TEMPLATE.replace("{{ANALYSIS_SUMMARY}}", input.analysisSummary || "없음")
    .replace("{{ANALYSIS_CULTURE_FIT}}", input.analysisCultureFit || "없음")
    .replace("{{ANALYSIS_BUSINESS_DOMAIN}}", input.analysisBusinessDomain || "없음")
    .replace("{{ANALYSIS_TECH_STACK}}", input.analysisTechStack || "없음")
    .replace("{{QUESTION_TEXT}}", input.questionText)
    .replace("{{CHAR_LIMIT}}", input.charLimit ? `${input.charLimit}자` : "제한 없음")
    .replace("{{ANSWER_TEXT}}", input.answerText)
}

export async function generateCoverLetterFeedback(
  provider: LlmProviderName,
  apiKey: string,
  input: {
    questionText: string
    answerText: string
    charLimit: number | null
    analysisSummary: string
    analysisCultureFit: string
    analysisBusinessDomain: string
    analysisTechStack: string
  }
): Promise<CoverLetterFeedbackResult> {
  const prompt = buildFeedbackPrompt(input)
  const rawText =
    provider === "gemini"
      ? await callGeminiJson(apiKey, prompt)
      : await callAnthropicJson(apiKey, prompt, { maxTokens: ANTHROPIC_MAX_TOKENS })
  return extractJsonObject<CoverLetterFeedbackResult>(provider, rawText)
}
