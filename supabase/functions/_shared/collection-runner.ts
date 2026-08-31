/**
 * 크롤링 수집 함수(collect-job-postings, collect-tech-news) 공통 오케스트레이션 러너 (Task 024)
 *
 * 두 Edge Function에 거의 동일하게 중복돼 있던 "소스별 실행 → upsert → 수집 로그 insert →
 * 실패 알림" 흐름을 하나로 합친다. 소스 확장(Task 030에서 catch/jasoseol 추가 예정) 시
 * 이 러너를 그대로 재사용할 수 있도록 소스/로그 테이블/upsert 로직만 호출부에서 주입받는다.
 */

import { delay } from "./fetch-with-policy.ts"
import { logEdgeFunctionError } from "./error-log.ts"

// deno-lint-ignore no-explicit-any
type AdminSupabaseClient = any

export interface CollectionSource<T> {
  name: string
  fetchAll: () => Promise<T[]>
}

export interface CollectionResult {
  source: string
  status: "success" | "failure" | "skipped"
  itemCount: number
  error: string | null
  durationMs: number
}

export interface RunCollectionSourcesOptions<T> {
  /** logEdgeFunctionError에 기록될 함수 이름(예: "collect-job-postings") */
  functionName: string
  supabaseAdmin: AdminSupabaseClient
  sources: CollectionSource<T>[]
  /** 수집 로그를 insert할 테이블명 (job_collection_logs | news_collection_logs) */
  logTable: string
  /** 정규화된 아이템을 대상 테이블에 upsert하는 콜백. 컬럼 매핑은 호출부(index.ts)가 담당 */
  upsert: (items: T[]) => Promise<{ error: { message: string } | null }>
  /**
   * 소스 사이 최소 요청 간격(ms). 같은 함수 안에서 여러 소스를 동시에 호출하면
   * 짧은 시간에 여러 사이트로 요청이 몰릴 수 있어 순차 실행 + 딜레이로 바꾼다.
   * 기본 1.5초 — 로드맵의 "1~2초 간격" 요구사항 중간값.
   */
  minDelayMs?: number
  /** 소스별 실패율 판정 임계치. 기본 30% — 로드맵 예시값 채택 */
  failureRateThreshold?: number
  /** 최근 로그가 이 값 미만이면 표본이 부족한 것으로 보고 판정을 보류한다(초기 1~2회 실패로 오탐 방지) */
  minSamples?: number
  /** 실패율 계산에 사용할 최근 로그 조회 건수 */
  recentSampleSize?: number
}

async function runSource<T>(
  source: CollectionSource<T>,
  upsert: (items: T[]) => Promise<{ error: { message: string } | null }>,
): Promise<CollectionResult> {
  const startedAt = performance.now()

  try {
    const items = await source.fetchAll()

    if (items.length === 0) {
      return { source: source.name, status: "skipped", itemCount: 0, error: null, durationMs: performance.now() - startedAt }
    }

    const { error } = await upsert(items)
    if (error) throw new Error(error.message)

    return {
      source: source.name,
      status: "success",
      itemCount: items.length,
      error: null,
      durationMs: performance.now() - startedAt,
    }
  } catch (error) {
    return {
      source: source.name,
      status: "failure",
      itemCount: 0,
      error: error instanceof Error ? error.message : String(error),
      durationMs: performance.now() - startedAt,
    }
  }
}

/**
 * 최근 로그를 재조회해 소스별 실패율을 계산하고, 임계치를 초과하면 알림을 보낸다.
 * 이번 호출 배치 하나만으로 판정하면 소스 1개 실패 시 실패율이 100%가 되어 과민 반응하므로,
 * 로그 테이블에 누적된 최근 이력을 기준으로 판정한다.
 */
async function checkFailureRateAndAlert(
  supabaseAdmin: AdminSupabaseClient,
  functionName: string,
  logTable: string,
  source: string,
  failureRateThreshold: number,
  minSamples: number,
  recentSampleSize: number,
): Promise<void> {
  const { data: recentLogs } = await supabaseAdmin
    .from(logTable)
    .select("status")
    .eq("source", source)
    .order("created_at", { ascending: false })
    .limit(recentSampleSize)

  if (!recentLogs || recentLogs.length < minSamples) return

  // deno-lint-ignore no-explicit-any
  const failureCount = recentLogs.filter((row: any) => row.status === "failure").length
  const failureRate = failureCount / recentLogs.length

  if (failureRate > failureRateThreshold) {
    await logEdgeFunctionError(
      supabaseAdmin,
      functionName,
      `소스 ${source} 최근 실패율 ${Math.round(failureRate * 100)}% (임계치 ${Math.round(failureRateThreshold * 100)}% 초과, 표본 ${recentLogs.length}건)`,
      { source, failureRate, sampleSize: recentLogs.length },
    )
  }
}

export async function runCollectionSources<T>(
  options: RunCollectionSourcesOptions<T>,
): Promise<CollectionResult[]> {
  const {
    functionName,
    supabaseAdmin,
    sources,
    logTable,
    upsert,
    minDelayMs = 1500,
    failureRateThreshold = 0.3,
    minSamples = 3,
    recentSampleSize = 10,
  } = options

  // 소스를 병렬(Promise.all)이 아닌 순차 실행 + 소스 사이 최소 딜레이로 호출해
  // 짧은 시간에 여러 사이트로 요청이 몰리는 것을 방지한다. 소스 수가 늘어날수록
  // 전체 실행 시간도 늘어나므로(소스 수 × (평균 응답시간 + 딜레이)), Edge Function
  // 실행시간 제한 내에 들어오는지 소스 확장 시 재확인이 필요하다.
  const results: CollectionResult[] = []
  for (const [index, source] of sources.entries()) {
    results.push(await runSource(source, upsert))
    if (index < sources.length - 1) await delay(minDelayMs)
  }

  await supabaseAdmin.from(logTable).insert(
    results.map((result) => ({
      source: result.source,
      status: result.status,
      item_count: result.itemCount,
      error: result.error,
      duration_ms: Math.round(result.durationMs),
    })),
  )

  for (const result of results) {
    if (result.status === "failure" && result.error) {
      await logEdgeFunctionError(supabaseAdmin, functionName, result.error, { source: result.source })
    }

    await checkFailureRateAndAlert(
      supabaseAdmin,
      functionName,
      logTable,
      result.source,
      failureRateThreshold,
      minSamples,
      recentSampleSize,
    )
  }

  return results
}
