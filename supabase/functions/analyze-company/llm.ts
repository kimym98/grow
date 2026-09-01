/**
 * analyze-company 전용 LLM 호출 로직 (Deno 네이티브)
 *
 * fetchWithRetry/JSON 추출/Gemini·Anthropic REST 호출 공용 골격은
 * supabase/functions/_shared/llm-client.ts로 통합되어 있다.
 * 이 파일에는 기업 분석 프롬프트(COMPANY_ANALYSIS_PROMPT_TEMPLATE/buildCompanyAnalysisPrompt)와
 * provider 분기만 남긴다 — review-document/llm.ts와 동일 패턴을 준용한다.
 */

import { callAnthropicJson, callGeminiJson, extractJsonObject } from "../_shared/llm-client.ts"

export type LlmProviderName = "gemini" | "anthropic"

export interface CompanyAnalysisResult {
  summary: string
  cultureFit: string
  businessDomain: string
  techStack: string
  expectedQuestions: string[]
}

const ANTHROPIC_MAX_TOKENS = 4096

// 사용자 입력(회사명/직무/메모/채용공고 컨텍스트)이 보간되지 않는 고정 골격만 담은 템플릿.
// 이 문자열의 해시가 LLM 응답 캐시 키에 포함되어 프롬프트 문구가 바뀌면 자동으로 캐시가 무효화된다
// (index.ts의 hashPromptTemplate 참고).
export const COMPANY_ANALYSIS_PROMPT_TEMPLATE = `당신은 신입/주니어 개발자의 취업 준비를 돕는 기업 분석 전문가입니다.
아래 지원 기업 정보를 바탕으로 지원자가 면접과 자기소개서 준비에 활용할 수 있는 분석을 작성하세요.

기업명: {{COMPANY_NAME}}
지원 직무: {{POSITION}}
지원자 메모: {{MEMO}}
채용공고 참고 정보: {{JOB_POSTING_CONTEXT}}

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"summary": string, "cultureFit": string, "businessDomain": string, "techStack": string, "expectedQuestions": string[]}`

function buildCompanyAnalysisPrompt(input: {
  companyName: string
  position: string
  memo: string
  jobPostingContext: string
}): string {
  return COMPANY_ANALYSIS_PROMPT_TEMPLATE.replace("{{COMPANY_NAME}}", input.companyName)
    .replace("{{POSITION}}", input.position || "미기재")
    .replace("{{MEMO}}", input.memo || "없음")
    .replace("{{JOB_POSTING_CONTEXT}}", input.jobPostingContext || "없음")
}

export async function generateCompanyAnalysis(
  provider: LlmProviderName,
  apiKey: string,
  input: { companyName: string; position: string; memo: string; jobPostingContext: string }
): Promise<CompanyAnalysisResult> {
  const prompt = buildCompanyAnalysisPrompt(input)
  const rawText =
    provider === "gemini"
      ? await callGeminiJson(apiKey, prompt)
      : await callAnthropicJson(apiKey, prompt, { maxTokens: ANTHROPIC_MAX_TOKENS })
  return extractJsonObject<CompanyAnalysisResult>(provider, rawText)
}
