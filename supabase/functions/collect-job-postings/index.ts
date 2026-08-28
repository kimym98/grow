// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { logEdgeFunctionError } from "../_shared/error-log.ts"
import { jobkoreaSource } from "./sources/jobkorea.ts"
import type { JobPostingSource, NormalizedJobPosting } from "./types.ts"

const sources: JobPostingSource[] = [jobkoreaSource]

interface CollectionResult {
  source: string
  status: "success" | "failure" | "skipped"
  itemCount: number
  error: string | null
  durationMs: number
}

// deno-lint-ignore no-explicit-any
async function runSource(source: JobPostingSource, supabaseAdmin: any): Promise<CollectionResult> {
  const startedAt = performance.now()

  try {
    const items: NormalizedJobPosting[] = await source.fetchAll()

    if (items.length === 0) {
      return { source: source.name, status: "skipped", itemCount: 0, error: null, durationMs: performance.now() - startedAt }
    }

    const rows = items.map((item) => ({
      title: item.title,
      company: item.company,
      location: item.location,
      career_level: item.careerLevel,
      deadline: item.deadline,
      tags: item.tags,
      url: item.url,
      source_url: item.sourceUrl,
      source: item.source,
    }))

    const { error } = await supabaseAdmin.from("job_postings").upsert(rows, { onConflict: "source_url" })
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
    // 소스가 하나뿐이라 병렬화 이득은 없지만, 이후 소스가 추가될 때를 대비해 collect-tech-news와 동일하게
    // Promise.all 구조를 유지하고 duration_ms를 기록해 병목 소스를 바로 식별할 수 있게 한다
    const results = await Promise.all(sources.map((source) => runSource(source, ctx.supabaseAdmin)))

    await ctx.supabaseAdmin.from("job_collection_logs").insert(
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
        await logEdgeFunctionError(ctx.supabaseAdmin, "collect-job-postings", result.error, {
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/collect-job-postings' \
    --header 'apiKey: <secret key>' \
    --data '{}'

*/
