// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { runCollectionSources } from "../_shared/collection-runner.ts"
import { geeknewsSource } from "./sources/geeknews.ts"
import { etnewsSource } from "./sources/etnews.ts"
import type { NewsSource } from "./types.ts"

const sources: NewsSource[] = [geeknewsSource, etnewsSource]

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (_req, ctx) => {
    const results = await runCollectionSources({
      functionName: "collect-tech-news",
      supabaseAdmin: ctx.supabaseAdmin,
      sources,
      logTable: "news_collection_logs",
      upsert: (items) =>
        ctx.supabaseAdmin.from("tech_news").upsert(
          items.map((item) => ({
            title: item.title,
            summary: item.summary,
            source: item.source,
            published_at: item.publishedAt,
            url: item.url,
          })),
          { onConflict: "url" },
        ),
    })

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
