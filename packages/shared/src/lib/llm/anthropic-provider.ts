import type { LlmProvider } from "../../types/llm-provider"
import { fetchWithRetry, parseJsonResponse } from "./fetch-with-retry"
import { buildDocumentReviewPrompt, buildQuizFollowUpPrompt } from "./prompt-templates"

const DEFAULT_MODEL = "claude-sonnet-4-5"
const ANTHROPIC_VERSION = "2023-06-01"
const MAX_TOKENS = 4096

interface AnthropicMessagesResponse {
  content?: Array<{ type: string; text?: string }>
}

/**
 * Anthropic Messages API(REST) 기반 LlmProvider 구현체
 * 참고: https://platform.claude.com/docs/en/api/messages
 */
export class AnthropicProvider implements LlmProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey
    this.model = model
  }

  private async createMessage(prompt: string): Promise<string> {
    const response = await fetchWithRetry("anthropic", "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = (await response.json()) as AnthropicMessagesResponse
    const text = data.content?.find((block) => block.type === "text")?.text

    if (!text) {
      throw new Error("anthropic 응답에 생성된 텍스트가 없습니다")
    }

    return text
  }

  async generateDocumentReview(input: {
    text: string
    documentType: "resume" | "portfolio"
  }): Promise<{ comments: Array<{ quote: string; comment: string }> }> {
    const prompt = buildDocumentReviewPrompt(input)
    const rawText = await this.createMessage(prompt)
    return parseJsonResponse("anthropic", rawText)
  }

  async generateQuizFollowUp(input: {
    question: string
    userAnswer: string
  }): Promise<{ followUpQuestion: string; explanation: string }> {
    const prompt = buildQuizFollowUpPrompt(input)
    const rawText = await this.createMessage(prompt)
    return parseJsonResponse("anthropic", rawText)
  }
}
