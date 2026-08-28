import { supabase } from "@/lib/supabase"

export type LlmProviderName = "gemini" | "anthropic"

export interface LlmKeyStatus {
  provider: LlmProviderName
  createdAt: string
  updatedAt: string
}

interface LlmKeyStatusRow {
  provider: LlmProviderName
  created_at: string
  updated_at: string
}

/** user_llm_key_status 뷰에서 본인이 등록한 provider/등록일만 조회한다 (평문 키는 절대 반환되지 않음) */
export async function fetchLlmKeyStatuses(): Promise<LlmKeyStatus[]> {
  const { data, error } = await supabase.from("user_llm_key_status").select("*")
  if (error) throw new Error(error.message)

  return (data as LlmKeyStatusRow[]).map((row) => ({
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/** set_user_llm_key RPC로 키를 등록/교체한다 (Vault에 암호화 저장, SECURITY DEFINER 함수 경유) */
export async function saveLlmKey(provider: LlmProviderName, apiKey: string): Promise<void> {
  const { error } = await supabase.rpc("set_user_llm_key", { p_provider: provider, p_api_key: apiKey })
  if (error) throw new Error(error.message)
}

/** delete_user_llm_key RPC로 키 등록을 해제한다 */
export async function deleteLlmKey(provider: LlmProviderName): Promise<void> {
  const { error } = await supabase.rpc("delete_user_llm_key", { p_provider: provider })
  if (error) throw new Error(error.message)
}

async function extractErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null)
  return body?.error?.message ?? `요청이 실패했습니다 (status: ${response.status})`
}

/**
 * 저장하기 전에 입력한 키가 실제로 동작하는지 브라우저에서 직접 호출해 확인한다.
 * BYO(사용자 소유) 키 패턴이므로 사용자 본인 브라우저에서 본인 키로 호출하는 것은 안전하다.
 * Anthropic은 이 용도로 anthropic-dangerous-direct-browser-access 헤더를 공식 지원한다.
 */
export async function testLlmKey(provider: LlmProviderName, apiKey: string): Promise<void> {
  const response =
    provider === "gemini"
      ? await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
          }
        )
      : await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 16,
            messages: [{ role: "user", content: "ping" }],
          }),
        })

  if (!response.ok) throw new Error(await extractErrorMessage(response))
}
