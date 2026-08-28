import type { LlmProvider } from "../../types/llm-provider"
import { AnthropicProvider } from "./anthropic-provider"
import { GeminiProvider } from "./gemini-provider"

export type LlmProviderName = "gemini" | "anthropic"

/** provider 이름과 사용자 API 키로 LlmProvider 구현체를 생성한다 */
export function createLlmProvider(providerName: LlmProviderName, apiKey: string): LlmProvider {
  switch (providerName) {
    case "gemini":
      return new GeminiProvider(apiKey)
    case "anthropic":
      return new AnthropicProvider(apiKey)
    default: {
      const exhaustiveCheck: never = providerName
      throw new Error(`지원하지 않는 LLM provider입니다: ${exhaustiveCheck}`)
    }
  }
}
