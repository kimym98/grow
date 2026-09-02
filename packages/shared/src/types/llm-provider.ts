/**
 * LLM Provider 추상화 인터페이스
 * 구현체(OpenAI 등)는 Task 013에서 작성하며, 여기서는 시그니처만 선언한다
 */
export interface LlmProvider {
  generateDocumentReview(input: {
    text: string
    documentType: "resume" | "portfolio"
  }): Promise<{
    comments: Array<{ quote: string; comment: string }>
  }>

  generateQuizFollowUp(input: {
    question: string
    userAnswer: string
  }): Promise<{
    followUpQuestion: string
    explanation: string
  }>
}
