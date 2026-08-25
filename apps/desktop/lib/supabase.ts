import { createSupabaseClient } from "@shared/lib/supabase-client"

/**
 * apps/desktop 전용 브라우저 Supabase 싱글턴 클라이언트
 * 환경변수는 apps/desktop/.env.local에서 주입된다.
 */
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
