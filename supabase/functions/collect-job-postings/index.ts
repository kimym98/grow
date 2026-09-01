// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { runCollectionSources } from "../_shared/collection-runner.ts"
import { careerSource } from "./sources/career.ts"
import { jobkoreaSource } from "./sources/jobkorea.ts"
import type { JobPostingSource } from "./types.ts"

const sources: JobPostingSource[] = [jobkoreaSource, careerSource]

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (_req, ctx) => {
    const results = await runCollectionSources({
      functionName: "collect-job-postings",
      supabaseAdmin: ctx.supabaseAdmin,
      sources,
      logTable: "job_collection_logs",
      upsert: (items) =>
        ctx.supabaseAdmin.from("job_postings").upsert(
          items.map((item) => ({
            title: item.title,
            company: item.company,
            location: item.location,
            career_level: item.careerLevel,
            deadline: item.deadline,
            tags: item.tags,
            url: item.url,
            source_url: item.sourceUrl,
            source: item.source,
          })),
          { onConflict: "source_url" },
        ),
    })

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
