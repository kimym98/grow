import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase 클라이언트 초기화 골격
 * url/key는 각 앱(apps/desktop, 향후 apps/mobile)에서 자신의 환경변수를 읽어 주입한다.
 * shared 패키지는 특정 앱의 process.env에 직접 의존하지 않는다.
 */
export function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key)
}
