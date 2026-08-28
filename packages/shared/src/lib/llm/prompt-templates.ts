/**
 * LLM Provider(Gemini/Anthropic) 공용 프롬프트 템플릿
 * 두 Provider 모두 여기서 만든 프롬프트를 그대로 사용하고, 응답을 JSON으로 강제 파싱한다
 * (Gemini는 responseMimeType으로 JSON을 강제하고, Anthropic은 프롬프트로 JSON만 응답하도록 지시한다)
 */

const DOCUMENT_REVIEW_JSON_SHAPE = `{"reviewedText": string, "comments": [{"quote": string, "comment": string}]}`

export function buildDocumentReviewPrompt(input: {
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
${DOCUMENT_REVIEW_JSON_SHAPE}`
}

const QUIZ_FOLLOW_UP_JSON_SHAPE = `{"followUpQuestion": string, "explanation": string}`

export function buildQuizFollowUpPrompt(input: { question: string; userAnswer: string }): string {
  return `당신은 CS 면접관입니다. 지원자가 아래 문제에 답변했습니다.
답변의 이해도를 확인할 수 있는 꼬리질문 하나와, 핵심 개념을 정리한 해설을 작성하세요.

문제: ${input.question}
지원자 답변: ${input.userAnswer}

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
${QUIZ_FOLLOW_UP_JSON_SHAPE}`
}
