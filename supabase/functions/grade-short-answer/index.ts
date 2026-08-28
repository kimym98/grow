// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

import { AuthRequiredError, jsonError, requireUserId } from "../_shared/auth.ts"
import { gradeShortAnswer, type LlmProviderName } from "./llm.ts"

interface GradeRequestBody {
  questionId: string
  quizSessionId: string
  answerText: string
  provider: LlmProviderName
}

const SUPPORTED_PROVIDERS: LlmProviderName[] = ["gemini", "anthropic"]
const PASS_SCORE_THRESHOLD = 70

export default {
  fetch: withSupabase({ auth: ["user"] }, async (req, ctx) => {
    try {
      requireUserId(ctx.userClaims)
    } catch (error) {
      if (error instanceof AuthRequiredError) return jsonError("UNAUTHENTICATED", error.message, 401)
      throw error
    }

    let body: GradeRequestBody
    try {
      body = await req.json()
    } catch {
      return jsonError("INVALID_BODY", "요청 본문이 올바르지 않습니다", 400)
    }

    if (!body.questionId || !body.quizSessionId || !body.answerText?.trim()) {
      return jsonError("INVALID_BODY", "questionId, quizSessionId, answerText가 필요합니다", 400)
    }
    if (!SUPPORTED_PROVIDERS.includes(body.provider)) {
      return jsonError("INVALID_PROVIDER", `provider는 ${SUPPORTED_PROVIDERS.join("/")} 중 하나여야 합니다`, 400)
    }

    // cs_questions는 전체 공개 읽기 테이블이라 소유권 검증이 필요 없다
    const { data: question, error: questionError } = await ctx.supabase
      .from("cs_questions")
      .select("question, answer, question_type")
      .eq("id", body.questionId)
      .single()

    if (questionError || !question) {
      return jsonError("NOT_FOUND", "문제를 찾을 수 없습니다", 404)
    }
    if (question.question_type !== "short-answer") {
      return jsonError("INVALID_QUESTION_TYPE", "서술형 문제가 아닙니다", 400)
    }

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

    try {
      const { score, feedback } = await gradeShortAnswer(body.provider, apiKey, {
        question: question.question,
        modelAnswer: question.answer,
        userAnswer: body.answerText,
      })

      const isCorrect = score >= PASS_SCORE_THRESHOLD

      // (quiz_session_id, question_id) 유니크 제약 기준으로 재제출 시 덮어쓴다
      const { error: upsertError } = await ctx.supabase.from("user_answers").upsert(
        {
          quiz_session_id: body.quizSessionId,
          question_id: body.questionId,
          answer_text: body.answerText,
          ai_score: score,
          ai_feedback: feedback,
          is_correct: isCorrect,
        },
        { onConflict: "quiz_session_id,question_id" }
      )

      if (upsertError) throw new Error(upsertError.message)

      return Response.json({ score, feedback, isCorrect })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return jsonError("GRADING_FAILED", message, 500)
    }
  }),
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. 로그인한 사용자의 access token으로 호출(auth: ["user"] 모드):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/grade-short-answer' \
    --header 'Authorization: Bearer <user access token>' \
    --header 'Content-Type: application/json' \
    --data '{"questionId": "<uuid>", "quizSessionId": "<uuid>", "answerText": "...", "provider": "gemini"}'

*/
