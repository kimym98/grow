// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { jobkoreaSource } from "./sources/jobkorea.ts"
import type { JobPostingSource, NormalizedJobPosting } from "./types.ts"

const sources: JobPostingSource[] = [jobkoreaSource]

interface CollectionResult {
  source: string
  status: "success" | "failure" | "skipped"
  itemCount: number
  error: string | null
}

// deno-lint-ignore no-explicit-any
async function runSource(source: JobPostingSource, supabaseAdmin: any): Promise<CollectionResult> {
  try {
    const items: NormalizedJobPosting[] = await source.fetchAll()

    if (items.length === 0) {
      return { source: source.name, status: "skipped", itemCount: 0, error: null }
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

    return { source: source.name, status: "success", itemCount: items.length, error: null }
  } catch (error) {
    return {
      source: source.name,
      status: "failure",
      itemCount: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (_req, ctx) => {
    const results: CollectionResult[] = []

    for (const source of sources) {
      const result = await runSource(source, ctx.supabaseAdmin)
      results.push(result)

      await ctx.supabaseAdmin.from("job_collection_logs").insert({
        source: result.source,
        status: result.status,
        item_count: result.itemCount,
        error: result.error,
      })
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
