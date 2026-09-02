import type { LlmProvider } from "../../types/llm-provider"
import { fetchWithRetry, parseJsonResponse } from "./fetch-with-retry"
import { buildDocumentReviewPrompt, buildQuizFollowUpPrompt } from "./prompt-templates"

const DEFAULT_MODEL = "gemini-3.6-flash"

interface GeminiGenerateContentResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

/**
 * Gemini API(REST) 기반 LlmProvider 구현체
 * 참고: https://ai.google.dev/api/generate-content
 */
export class GeminiProvider implements LlmProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey
    this.model = model
  }

  private async generateContent(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const response = await fetchWithRetry("gemini", url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    })

    const data = (await response.json()) as GeminiGenerateContentResponse
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error("gemini 응답에 생성된 텍스트가 없습니다")
    }

    return text
  }

  async generateDocumentReview(input: {
    text: string
    documentType: "resume" | "portfolio"
  }): Promise<{
    comments: Array<{ quote: string; comment: string }>
    interviewQuestions: Array<{ question: string; intent: string; category: string; sourceQuote?: string }>
  }> {
    const prompt = buildDocumentReviewPrompt(input)
    const rawText = await this.generateContent(prompt)
    return parseJsonResponse("gemini", rawText)
  }

  async generateQuizFollowUp(input: {
    question: string
    userAnswer: string
  }): Promise<{ followUpQuestion: string; explanation: string }> {
    const prompt = buildQuizFollowUpPrompt(input)
    const rawText = await this.generateContent(prompt)
    return parseJsonResponse("gemini", rawText)
  }
}
