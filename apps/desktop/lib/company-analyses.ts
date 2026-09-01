import { rowToCompanyAnalysis, type CompanyAnalysis, type CompanyAnalysisRow } from "@app/shared"

import { supabase } from "@/lib/supabase"
import type { LlmProviderName } from "@/lib/llm-keys"

/** company_analyses 테이블에서 특정 지원 기업의 최신 분석 결과를 조회한다 (RLS로 소유자 데이터만 반환) */
export async function fetchCompanyAnalysis(applicationId: string): Promise<CompanyAnalysis | null> {
  const { data, error } = await supabase
    .from("company_analyses")
    .select("*")
    .eq("application_id", applicationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return rowToCompanyAnalysis(data as CompanyAnalysisRow)
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      const body = await context.json().catch(() => null)
      if (body?.message) return body.message as string
    }
  }
  return error instanceof Error ? error.message : "기업 분석 요청에 실패했습니다"
}

/** analyze-company Edge Function을 호출해 기업 분석을 시작시킨다 (비동기로 진행되며 status를 폴링해 확인) */
export async function triggerCompanyAnalysis(applicationId: string, provider: LlmProviderName): Promise<void> {
  const { error } = await supabase.functions.invoke("analyze-company", {
    body: { applicationId, provider },
  })

  if (error) throw new Error(await extractFunctionErrorMessage(error))
}
