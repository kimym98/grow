/**
 * Edge Function 실행 실패를 edge_function_error_logs 테이블에 기록하고,
 * ALERT_WEBHOOK_URL(Slack 등) 환경변수가 설정되어 있으면 알림도 함께 보낸다.
 * 둘 다 실패해도(테이블 insert 오류, webhook 요청 실패) 호출부의 에러 응답 흐름을 막지 않도록
 * 내부에서 예외를 삼킨다 — 모니터링 실패가 실제 요청 처리 실패로 이어지면 안 된다.
 */

// deno-lint-ignore no-explicit-any
type AdminSupabaseClient = any

export interface EdgeFunctionErrorContext {
  [key: string]: unknown
}

export async function logEdgeFunctionError(
  supabaseAdmin: AdminSupabaseClient,
  functionName: string,
  message: string,
  context?: EdgeFunctionErrorContext
): Promise<void> {
  try {
    await supabaseAdmin.from("edge_function_error_logs").insert({
      function_name: functionName,
      message,
      context: context ?? null,
    })
  } catch (error) {
    console.error(`[error-log] ${functionName} 로그 기록 실패:`, error)
  }

  const webhookUrl = Deno.env.get("ALERT_WEBHOOK_URL")
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: `[${functionName}] ${message}` }),
    })
  } catch (error) {
    console.error(`[error-log] ${functionName} webhook 알림 실패:`, error)
  }
}
