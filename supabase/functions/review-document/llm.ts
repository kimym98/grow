/**
 * review-document 전용 LLM 호출 로직 (Deno 네이티브)
 *
 * fetchWithRetry/JSON 추출/Gemini·Anthropic REST 호출 공용 골격은
 * supabase/functions/_shared/llm-client.ts로 통합되어 있다.
 * 이 파일에는 문서 첨삭 프롬프트(RESUME_PROMPT_TEMPLATE/PORTFOLIO_PROMPT_TEMPLATE)와 provider 분기만 남긴다
 * — 프롬프트 문구를 바꿀 때는 packages/shared/src/lib/llm/prompt-templates.ts의 buildResumePrompt/buildPortfolioPrompt
 * (동일 문자열, Node/Next.js용)도 함께 확인한다. 두 곳 모두 동일 문구를 유지해야 캐시 해시와 실제 호출 결과가
 * 일관된다(완전한 단일 소스화는 Task 025에서 Deno 번들 크기 문제로 보류됨).
 */

import { callAnthropicJson, callGeminiJson, extractJsonObject } from "../_shared/llm-client.ts"

export type LlmProviderName = "gemini" | "anthropic"

export interface DocumentReviewResult {
  comments: Array<{ quote: string; comment: string }>
}

const ANTHROPIC_MAX_TOKENS = 4096

// 사용자 입력(원문)만 보간되는 고정 골격 템플릿. 이 문자열의 해시가 LLM 응답 캐시 키에 포함되어
// 프롬프트 문구가 바뀌면 자동으로 캐시가 무효화된다 (index.ts의 hashPromptTemplate 참고).
// 이력서/포트폴리오는 평가 관점이 완전히 달라 템플릿 자체를 분리한다 — 한쪽 문구만 바뀌어도
// 그 유형의 캐시만 무효화되고 다른 유형의 캐시는 그대로 재사용된다(review.type로 템플릿을 선택하는 index.ts 참고)
export const RESUME_PROMPT_TEMPLATE = `당신은 신입/주니어 개발자 취업을 돕는 이력서 첨삭 전문가입니다.
아래 원문을 읽고 다음 세 가지 관점에서 개선이 필요한 부분을 직접 인용(quote)하고, 왜 고쳐야 하는지 코멘트를 남기세요.

평가 관점:
1. 경력·기술스택 표현: 담당 업무의 역할/범위가 드러나는지, 기술 나열이 사용 맥락 없이 키워드 덤프로 끝나지 않는지
2. 정량적 성과 서술: "개선했다" 류의 서술을 수치·기간·비교 기준이 있는 문장으로 유도
3. 가독성·포맷: 항목 길이 균형, 시제·어미 일관성, 불릿 1개당 1메시지 원칙

예시 1
원문: "백엔드 개발 업무를 담당했습니다."
기대 코멘트: 담당 업무의 역할과 범위가 드러나지 않는 키워드 나열입니다. 어떤 시스템을, 어떤 기술로, 어느 정도 규모로 담당했는지 구체화하세요.

예시 2
원문: "API 응답 속도를 개선했습니다."
기대 코멘트: "개선했다"는 정량적 근거가 없는 서술입니다. 개선 전/후 응답 시간, 측정 방법, 개선에 사용한 기법을 함께 적으면 설득력이 높아집니다.

예시 3
원문: "React, Next.js, TypeScript, Node.js, AWS를 사용할 수 있습니다."
기대 코멘트: 기술 스택을 사용 맥락 없이 나열만 하고 있습니다. 각 기술을 실제로 어떤 문제를 해결하는 데 썼는지 한 줄씩이라도 덧붙이세요.

원문:
"""
{{TEXT}}
"""

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"comments": [{"quote": string, "comment": string}]}`

export const PORTFOLIO_PROMPT_TEMPLATE = `당신은 신입/주니어 개발자 취업을 돕는 포트폴리오 첨삭 전문가입니다.
아래 원문을 읽고 다음 세 가지 관점에서 개선이 필요한 부분을 직접 인용(quote)하고, 왜 고쳐야 하는지 코멘트를 남기세요.

평가 관점:
1. 프로젝트 기여도: 팀 성과와 본인 기여의 구분이 명확한지("우리는" → "내가 맡은 부분")
2. 문제해결 서사: 문제 상황 → 시도 → 결과 흐름이 드러나는지, 결과만 나열되어 있지 않은지
3. 기술 선택 근거: 사용 기술에 대안 검토·트레이드오프 언급이 있는지

예시 1
원문: "우리 팀은 실시간 채팅 기능을 성공적으로 구현했습니다."
기대 코멘트: 팀 성과와 본인 기여가 구분되지 않습니다. "우리는"을 본인이 실제로 맡은 부분("나는 WebSocket 연결 관리와 재접속 로직을 맡아") 중심으로 바꿔보세요.

예시 2
원문: "결과적으로 페이지 로딩 속도가 크게 빨라졌습니다."
기대 코멘트: 문제 상황과 시도 과정 없이 결과만 나열되어 있습니다. 어떤 문제를 발견했고, 어떤 방법을 시도했으며, 왜 그 방법을 선택했는지 흐름을 추가하세요.

예시 3
원문: "상태 관리는 Redux를 사용했습니다."
기대 코멘트: 기술 선택에 대한 근거가 없습니다. Redux 대신 고려했던 대안(Context API, Zustand 등)과 이 프로젝트에서 Redux를 택한 이유(트레이드오프)를 함께 서술하세요.

원문:
"""
{{TEXT}}
"""

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"comments": [{"quote": string, "comment": string}]}`

function buildDocumentReviewPrompt(input: { text: string; documentType: "resume" | "portfolio" }): string {
  const template = input.documentType === "resume" ? RESUME_PROMPT_TEMPLATE : PORTFOLIO_PROMPT_TEMPLATE
  return template.replace("{{TEXT}}", input.text)
}

export async function generateDocumentReview(
  provider: LlmProviderName,
  apiKey: string,
  input: { text: string; documentType: "resume" | "portfolio" }
): Promise<DocumentReviewResult> {
  const prompt = buildDocumentReviewPrompt(input)
  const rawText =
    provider === "gemini"
      ? await callGeminiJson(apiKey, prompt)
      : await callAnthropicJson(apiKey, prompt, { maxTokens: ANTHROPIC_MAX_TOKENS })
  return extractJsonObject<DocumentReviewResult>(provider, rawText)
}
