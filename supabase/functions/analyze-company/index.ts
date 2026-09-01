// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { AuthRequiredError, jsonError, requireUserId } from "../_shared/auth.ts"
import { getCachedLlmResponse, setCachedLlmResponse, hashPromptTemplate, sha256Hex } from "../_shared/llm-cache.ts"
import { logEdgeFunctionError } from "../_shared/error-log.ts"
import { normalizeCompanyName } from "../_shared/normalize-company-name.ts"
import {
  COMPANY_ANALYSIS_PROMPT_TEMPLATE,
  generateCompanyAnalysis,
  type CompanyAnalysisResult,
  type LlmProviderName,
} from "./llm.ts"

interface AnalyzeRequestBody {
  applicationId: string
  provider: LlmProviderName
}

const SUPPORTED_PROVIDERS: LlmProviderName[] = ["gemini", "anthropic"]
const FUNCTION_NAME = "analyze-company"
// job_postings 부분 매칭 후보를 너무 많이 끌어오지 않도록 상한을 둔다
const JOB_POSTING_CANDIDATE_LIMIT = 20

/**
 * 지원 기업명과 매칭되는 채용공고를 찾아 LLM 프롬프트에 넣을 컨텍스트 텍스트를 만든다.
 * job_postings 매칭은 부가 정보일 뿐 분석의 필수 조건이 아니므로, 조회/매칭 중 어떤 오류가 나도
 * 절대 throw하지 않고 빈 문자열을 반환한다(로드맵 명시: 하드 의존 금지).
 */
async function buildJobPostingContext(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  companyName: string,
  companyKey: string
): Promise<string> {
  try {
    const { data: candidates } = await supabase
      .from("job_postings")
      .select("title, company, location, career_level, tags")
      .ilike("company", `%${companyName}%`)
      .limit(JOB_POSTING_CANDIDATE_LIMIT)

    if (!candidates || candidates.length === 0) return ""

    const matched = candidates.find(
      (row: { company: string }) => normalizeCompanyName(row.company) === companyKey
    )
    if (!matched) return ""

    return `제목: ${matched.title} / 경력: ${matched.career_level} / 지역: ${matched.location} / 태그: ${(matched.tags ?? []).join(", ")}`
  } catch (error) {
    console.warn("[analyze-company] job_postings 매칭 실패(무시하고 진행):", error)
    return ""
  }
}

export default {
  fetch: withSupabase({ auth: ["user"] }, async (req, ctx) => {
    let userId: string
    try {
      userId = requireUserId(ctx.userClaims)
    } catch (error) {
      if (error instanceof AuthRequiredError) return jsonError("UNAUTHENTICATED", error.message, 401)
      throw error
    }

    let body: AnalyzeRequestBody
    try {
      body = await req.json()
    } catch {
      return jsonError("INVALID_BODY", "요청 본문이 올바르지 않습니다", 400)
    }

    if (!body.applicationId) {
      return jsonError("INVALID_BODY", "applicationId가 필요합니다", 400)
    }
    if (!SUPPORTED_PROVIDERS.includes(body.provider)) {
      return jsonError("INVALID_PROVIDER", `provider는 ${SUPPORTED_PROVIDERS.join("/")} 중 하나여야 합니다`, 400)
    }

    // 소유권 확인: ctx.supabase는 RLS가 적용된 클라이언트라 본인 레코드만 조회된다
    // (타 사용자의 applicationId를 넘겨도 조회 결과가 비어 NOT_FOUND로 처리됨)
    const { data: application, error: applicationError } = await ctx.supabase
      .from("company_applications")
      .select("*")
      .eq("id", body.applicationId)
      .single()

    if (applicationError || !application) {
      return jsonError("NOT_FOUND", "지원 기업을 찾을 수 없습니다", 404)
    }

    const { data: latestAnalysis } = await ctx.supabase
      .from("company_analyses")
      .select("*")
      .eq("application_id", body.applicationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestAnalysis && latestAnalysis.status === "processing") {
      return jsonError("ALREADY_PROCESSING", "이미 기업 분석이 진행 중입니다", 409)
    }

    // API 키가 없으면 status를 건드리지 않고 즉시 반환한다 (클라이언트가 설정 화면으로 유도)
    const { data: apiKey, error: keyError } = await ctx.supabase.rpc("get_user_llm_key", {
      p_provider: body.provider,
    })

    if (keyError) {
      return jsonError("KEY_LOOKUP_FAILED", keyError.message, 500)
    }
    if (!apiKey) {
      return jsonError(
        "API_KEY_NOT_FOUND",
        `등록된 ${body.provider} API 키가 없습니다. 설정에서 키를 등록해주세요.`,
        400
      )
    }

    // application_id 기준으로 기존 분석 row가 있으면 재사용(update), 없으면 새로 생성(insert)한다.
    // company_analyses.application_id에는 별도 유니크 제약이 없어 upsert(onConflict) 대신
    // 위에서 이미 조회한 latestAnalysis 존재 여부로 분기한다.
    let analysisId: string
    if (latestAnalysis) {
      analysisId = latestAnalysis.id
      await ctx.supabase
        .from("company_analyses")
        .update({ status: "processing", error_message: null })
        .eq("id", analysisId)
    } else {
      const { data: inserted, error: insertError } = await ctx.supabase
        .from("company_analyses")
        .insert({ user_id: userId, application_id: body.applicationId, status: "processing" })
        .select("id")
        .single()

      if (insertError || !inserted) {
        return jsonError("CREATE_FAILED", insertError?.message ?? "분석 레코드 생성에 실패했습니다", 500)
      }
      analysisId = inserted.id
    }

    try {
      const companyName: string = application.company_name
      const position: string = application.position ?? ""
      const memo: string = application.memo ?? ""

      const jobPostingContext = await buildJobPostingContext(
        ctx.supabase,
        companyName,
        application.company_key
      )

      // 캐시 키: 프롬프트 템플릿 해시 + provider + 회사명/직무/메모/채용공고 컨텍스트.
      // 프롬프트 문구가 바뀌면 해시가 바뀌어 자동으로 캐시가 무효화되고, 입력값 중 하나라도
      // 바뀌면(회사명 수정, 직무 변경 등) 새 키가 되어 재호출된다
      const promptTemplateHash = await hashPromptTemplate(COMPANY_ANALYSIS_PROMPT_TEMPLATE)
      const cacheKey = await sha256Hex(
        `${promptTemplateHash}|${body.provider}|${companyName}|${position}|${memo}|${jobPostingContext}`
      )

      const cached = await getCachedLlmResponse<CompanyAnalysisResult>(ctx.supabase, FUNCTION_NAME, cacheKey)

      const result =
        cached ??
        (await generateCompanyAnalysis(body.provider, apiKey, {
          companyName,
          position,
          memo,
          jobPostingContext,
        }))

      if (!cached) {
        await setCachedLlmResponse(ctx.supabase, userId, FUNCTION_NAME, cacheKey, result)
      }

      const inputSnapshot = { companyName, position, memo, jobPostingContext }

      const { error: updateError } = await ctx.supabase
        .from("company_analyses")
        .update({
          status: "completed",
          summary: result.summary,
          culture_fit: result.cultureFit,
          business_domain: result.businessDomain,
          tech_stack: result.techStack,
          expected_questions: result.expectedQuestions,
          input_snapshot: inputSnapshot,
          cache_key: cacheKey,
          error_message: null,
        })
        .eq("id", analysisId)

      if (updateError) throw new Error(updateError.message)

      return Response.json({ status: "completed", id: analysisId })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      await ctx.supabase
        .from("company_analyses")
        .update({ status: "failed", error_message: message })
        .eq("id", analysisId)

      await logEdgeFunctionError(ctx.supabaseAdmin, "analyze-company", message, {
        applicationId: body.applicationId,
        provider: body.provider,
      })

      return jsonError("ANALYSIS_FAILED", message, 500)
    }
  }),
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. 로그인한 사용자의 access token으로 호출(auth: ["user"] 모드):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/analyze-company' \
    --header 'Authorization: Bearer <user access token>' \
    --header 'Content-Type: application/json' \
    --data '{"applicationId": "<uuid>", "provider": "gemini"}'

*/
