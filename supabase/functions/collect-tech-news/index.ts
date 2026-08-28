// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { logEdgeFunctionError } from "../_shared/error-log.ts"
import { geeknewsSource } from "./sources/geeknews.ts"
import { etnewsSource } from "./sources/etnews.ts"
import type { NewsSource, NormalizedNewsItem } from "./types.ts"

const sources: NewsSource[] = [geeknewsSource, etnewsSource]

interface CollectionResult {
  source: string
  status: "success" | "failure" | "skipped"
  itemCount: number
  error: string | null
  durationMs: number
}

// deno-lint-ignore no-explicit-any
async function runSource(source: NewsSource, supabaseAdmin: any): Promise<CollectionResult> {
  const startedAt = performance.now()

  try {
    const items: NormalizedNewsItem[] = await source.fetchAll()

    if (items.length === 0) {
      return { source: source.name, status: "skipped", itemCount: 0, error: null, durationMs: performance.now() - startedAt }
    }

    const rows = items.map((item) => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      published_at: item.publishedAt,
      url: item.url,
    }))

    const { error } = await supabaseAdmin.from("tech_news").upsert(rows, { onConflict: "url" })
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

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (_req, ctx) => {
    // 소스별 fetchAll()은 서로 다른 외부 사이트에 대한 독립적인 네트워크 호출이라 병렬로 실행해도 안전하다.
    // upsert 대상 테이블(tech_news)도 소스별로 겹치지 않는 url 기준이라 동시 upsert가 서로 덮어쓰지 않는다
    const results = await Promise.all(sources.map((source) => runSource(source, ctx.supabaseAdmin)))

    await ctx.supabaseAdmin.from("news_collection_logs").insert(
      results.map((result) => ({
        source: result.source,
        status: result.status,
        item_count: result.itemCount,
        error: result.error,
        duration_ms: Math.round(result.durationMs),
      }))
    )

    for (const result of results) {
      if (result.status === "failure" && result.error) {
        await logEdgeFunctionError(ctx.supabaseAdmin, "collect-tech-news", result.error, {
          source: result.source,
        })
      }
    }

    return Response.json({ results })
  }),
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request (secret key required, server-to-server 호출):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/collect-tech-news' \
    --header 'apiKey: <secret key>' \
    --data '{}'

*/
