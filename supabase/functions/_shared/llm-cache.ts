/**
 * review-document / grade-short-answer 등 LLM 호출 결과를 캐싱하는 공용 헬퍼.
 * 동일한 (사용자, 함수, 입력) 조합에 대해 LLM API를 재호출하지 않도록 llm_response_cache 테이블에 결과를 저장/조회한다.
 * 캐시 키에 사용자 ID(RLS로 강제)와 프롬프트 템플릿 해시를 포함해 다른 사용자 간 결과가 섞이거나
 * 프롬프트가 바뀐 뒤에도 예전 결과가 재사용되는 일이 없도록 한다.
 * hashPromptTemplate은 프롬프트 템플릿 해시 전용 헬퍼로, Task 031(기업 분석) 등 다른 캐시에서도 재사용한다.
 */

// deno-lint-ignore no-explicit-any
type RlsSupabaseClient = any

/** 캐시 키로 쓸 SHA-256 해시(hex)를 계산한다. 입력 순서만 바뀌어도 다른 키가 되도록 호출부에서 구분자로 필드를 이어붙여야 한다 */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

/** 프롬프트 템플릿(정적 문자열)의 해시를 계산한다. 템플릿 문구가 바뀌면 해시가 바뀌어 캐시가 자동 무효화된다 */
export async function hashPromptTemplate(template: string): Promise<string> {
  return sha256Hex(template)
}

/**
 * 캐시를 조회한다. supabase는 RLS가 적용된 사용자 클라이언트(ctx.supabase)여야 하며,
 * auth.uid() = user_id 정책에 의해 다른 사용자의 캐시는 조회되지 않는다.
 */
export async function getCachedLlmResponse<T>(
  supabase: RlsSupabaseClient,
  functionName: string,
  cacheKey: string
): Promise<T | null> {
  const { data, error } = await supabase
    .from("llm_response_cache")
    .select("response")
    .eq("function_name", functionName)
    .eq("cache_key", cacheKey)
    .maybeSingle()

  if (error || !data) return null
  return data.response as T
}

/** 캐시를 저장한다. 동일 (user_id, function_name, cache_key) 조합이면 덮어쓴다 */
export async function setCachedLlmResponse<T>(
  supabase: RlsSupabaseClient,
  userId: string,
  functionName: string,
  cacheKey: string,
  response: T
): Promise<void> {
  await supabase.from("llm_response_cache").upsert(
    { user_id: userId, function_name: functionName, cache_key: cacheKey, response },
    { onConflict: "user_id,function_name,cache_key" }
  )
}
