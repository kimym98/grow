/**
 * LLM Provider(Gemini/Anthropic) 공용 프롬프트 템플릿
 * 두 Provider 모두 여기서 만든 프롬프트를 그대로 사용하고, 응답을 JSON으로 강제 파싱한다
 * (Gemini는 responseMimeType으로 JSON을 강제하고, Anthropic은 프롬프트로 JSON만 응답하도록 지시한다)
 *
 * 이력서/포트폴리오는 평가 관점이 서로 달라 buildResumePrompt/buildPortfolioPrompt로 완전히 분리하고,
 * 공통 요소(JSON 응답 형식, 원문 삽입 블록, "JSON만 응답" 지시)만 공유 상수로 추출한다.
 * 공개 진입점은 buildDocumentReviewPrompt 하나로 유지한다.
 */

// Task 037에서 interviewQuestions 필드를 추가할 예정이므로, 이 상수만 바꾸면 두 프롬프트에 동일하게 반영된다
const DOCUMENT_REVIEW_JSON_SHAPE = `{"comments": [{"quote": string, "comment": string}]}`

const JSON_ONLY_INSTRUCTION = `다른 설명 없이 아래 JSON 형식으로만 응답하세요:\n${DOCUMENT_REVIEW_JSON_SHAPE}`

function buildOriginalTextBlock(text: string): string {
  return `원문:\n"""\n${text}\n"""`
}

const RESUME_FEW_SHOT_EXAMPLES = `예시 1
원문: "백엔드 개발 업무를 담당했습니다."
기대 코멘트: 담당 업무의 역할과 범위가 드러나지 않는 키워드 나열입니다. 어떤 시스템을, 어떤 기술로, 어느 정도 규모로 담당했는지 구체화하세요.

예시 2
원문: "API 응답 속도를 개선했습니다."
기대 코멘트: "개선했다"는 정량적 근거가 없는 서술입니다. 개선 전/후 응답 시간, 측정 방법, 개선에 사용한 기법을 함께 적으면 설득력이 높아집니다.

예시 3
원문: "React, Next.js, TypeScript, Node.js, AWS를 사용할 수 있습니다."
기대 코멘트: 기술 스택을 사용 맥락 없이 나열만 하고 있습니다. 각 기술을 실제로 어떤 문제를 해결하는 데 썼는지 한 줄씩이라도 덧붙이세요.`

const PORTFOLIO_FEW_SHOT_EXAMPLES = `예시 1
원문: "우리 팀은 실시간 채팅 기능을 성공적으로 구현했습니다."
기대 코멘트: 팀 성과와 본인 기여가 구분되지 않습니다. "우리는"을 본인이 실제로 맡은 부분("나는 WebSocket 연결 관리와 재접속 로직을 맡아") 중심으로 바꿔보세요.

예시 2
원문: "결과적으로 페이지 로딩 속도가 크게 빨라졌습니다."
기대 코멘트: 문제 상황과 시도 과정 없이 결과만 나열되어 있습니다. 어떤 문제를 발견했고, 어떤 방법을 시도했으며, 왜 그 방법을 선택했는지 흐름을 추가하세요.

예시 3
원문: "상태 관리는 Redux를 사용했습니다."
기대 코멘트: 기술 선택에 대한 근거가 없습니다. Redux 대신 고려했던 대안(Context API, Zustand 등)과 이 프로젝트에서 Redux를 택한 이유(트레이드오프)를 함께 서술하세요.`

function buildResumePrompt(text: string): string {
  return `당신은 신입/주니어 개발자 취업을 돕는 이력서 첨삭 전문가입니다.
아래 원문을 읽고 다음 세 가지 관점에서 개선이 필요한 부분을 직접 인용(quote)하고, 왜 고쳐야 하는지 코멘트를 남기세요.

평가 관점:
1. 경력·기술스택 표현: 담당 업무의 역할/범위가 드러나는지, 기술 나열이 사용 맥락 없이 키워드 덤프로 끝나지 않는지
2. 정량적 성과 서술: "개선했다" 류의 서술을 수치·기간·비교 기준이 있는 문장으로 유도
3. 가독성·포맷: 항목 길이 균형, 시제·어미 일관성, 불릿 1개당 1메시지 원칙

${RESUME_FEW_SHOT_EXAMPLES}

${buildOriginalTextBlock(text)}

${JSON_ONLY_INSTRUCTION}`
}

function buildPortfolioPrompt(text: string): string {
  return `당신은 신입/주니어 개발자 취업을 돕는 포트폴리오 첨삭 전문가입니다.
아래 원문을 읽고 다음 세 가지 관점에서 개선이 필요한 부분을 직접 인용(quote)하고, 왜 고쳐야 하는지 코멘트를 남기세요.

평가 관점:
1. 프로젝트 기여도: 팀 성과와 본인 기여의 구분이 명확한지("우리는" → "내가 맡은 부분")
2. 문제해결 서사: 문제 상황 → 시도 → 결과 흐름이 드러나는지, 결과만 나열되어 있지 않은지
3. 기술 선택 근거: 사용 기술에 대안 검토·트레이드오프 언급이 있는지

${PORTFOLIO_FEW_SHOT_EXAMPLES}

${buildOriginalTextBlock(text)}

${JSON_ONLY_INSTRUCTION}`
}

export function buildDocumentReviewPrompt(input: {
  text: string
  documentType: "resume" | "portfolio"
}): string {
  return input.documentType === "resume"
    ? buildResumePrompt(input.text)
    : buildPortfolioPrompt(input.text)
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
