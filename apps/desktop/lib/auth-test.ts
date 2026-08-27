import { supabase } from "@/lib/supabase"

/**
 * 개발/테스트 전용 계정 정보. 프로덕션 빌드(NODE_ENV=production)에서는
 * 이 값을 사용하는 TestLoginButton 자체가 렌더링되지 않는다.
 */
export const TEST_ACCOUNT_EMAIL = "qa-tester@example.com"
export const TEST_ACCOUNT_PASSWORD = "GrowTest1234!"

/**
 * 테스트 계정으로 로그인한다. 계정이 아직 없으면(최초 1회) signUp으로 생성 후 다시 로그인한다.
 * Supabase 프로젝트의 이메일 확인(email confirmation)이 켜져 있으면 최초 signUp 직후에는
 * 로그인이 거부될 수 있으며, 이 경우 Supabase 대시보드에서 해당 계정을 1회 수동 확인해야 한다.
 */
export async function signInAsTestAccount(): Promise<void> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNT_EMAIL,
    password: TEST_ACCOUNT_PASSWORD,
  })

  if (!signInError) return

  const { error: signUpError } = await supabase.auth.signUp({
    email: TEST_ACCOUNT_EMAIL,
    password: TEST_ACCOUNT_PASSWORD,
  })

  if (signUpError) throw signUpError

  const { error: retryError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNT_EMAIL,
    password: TEST_ACCOUNT_PASSWORD,
  })

  if (retryError) {
    throw new Error(
      "테스트 계정이 생성되었지만 로그인에 실패했습니다. Supabase 대시보드에서 이메일 확인이 필요한지 확인해주세요."
    )
  }
}
