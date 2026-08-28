import {
  rowToCsQuestion,
  rowToQuizSession,
  rowToUserAnswer,
  type CsQuestion,
  type CsQuestionRow,
  type QuizSession,
  type QuizSessionRow,
  type UserAnswer,
  type UserAnswerRow,
} from "@app/shared"

import { supabase } from "@/lib/supabase"
import type { LlmProviderName } from "@/lib/llm-keys"

export const QUESTIONS_PER_CATEGORY_SESSION = 5

/** 퀴즈 카테고리 값을 한국어 라벨로 변환한다 (커맨드팔레트, 결과 화면 등에서 공용 사용) */
export const QUIZ_CATEGORY_LABELS: Record<QuizSession["category"], string> = {
  os: "운영체제",
  network: "네트워크",
  database: "데이터베이스",
  "data-structure": "자료구조/알고리즘",
  "ai-llm": "AI/LLM",
  frontend: "프론트엔드",
  mixed: "모의고사",
}

/**
 * 단일 카테고리 문제를 무작위로 조회한다 (cs_questions는 전체 공개 읽기).
 * get_random_quiz_questions RPC에 카테고리를 지정해 객관식/서술형이 고르게 섞이도록 한다
 * (created_at 순으로 조회하면 카테고리당 객관식을 먼저 시딩한 순서 때문에 서술형이 노출되지 않는 문제가 있었다)
 */
export async function fetchQuestionsForCategory(
  category: Exclude<CsQuestion["category"], never>
): Promise<CsQuestion[]> {
  const { data, error } = await supabase.rpc("get_random_quiz_questions", {
    p_count: QUESTIONS_PER_CATEGORY_SESSION,
    p_category: category,
  })

  if (error) throw new Error(error.message)

  return (data as CsQuestionRow[]).map(rowToCsQuestion)
}

/** 전체 카테고리를 아우르는 모의고사용 무작위 문제를 get_random_quiz_questions RPC로 조회한다 */
export async function fetchMixedQuestions(count: number): Promise<CsQuestion[]> {
  const { data, error } = await supabase.rpc("get_random_quiz_questions", { p_count: count })

  if (error) throw new Error(error.message)

  return (data as CsQuestionRow[]).map(rowToCsQuestion)
}

/** 새 퀴즈 세션을 생성한다. id는 라우팅에서 이미 생성된 값을 그대로 사용한다 */
export async function createQuizSession(
  id: string,
  category: QuizSession["category"],
  totalCount: number
): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const { error } = await supabase.from("quiz_sessions").upsert(
    {
      id,
      user_id: userData.user.id,
      category,
      total_count: totalCount,
      correct_count: 0,
    },
    { onConflict: "id" }
  )

  if (error) throw new Error(error.message)
}

/** 객관식 답안을 즉시 기록한다 (재제출 시 덮어씀) */
export async function recordMultipleChoiceAnswer(
  quizSessionId: string,
  questionId: string,
  selected: number,
  isCorrect: boolean
): Promise<void> {
  const { error } = await supabase
    .from("user_answers")
    .upsert(
      { quiz_session_id: quizSessionId, question_id: questionId, selected, is_correct: isCorrect },
      { onConflict: "quiz_session_id,question_id" }
    )

  if (error) throw new Error(error.message)
}

export interface ShortAnswerGrade {
  score: number
  feedback: string
  isCorrect: boolean
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      const body = await context.json().catch(() => null)
      if (body?.message) return body.message as string
    }
  }
  return error instanceof Error ? error.message : "채점 요청에 실패했습니다"
}

/** grade-short-answer Edge Function을 호출해 서술형 답안을 AI로 채점하고 user_answers에 반영한다 */
export async function gradeShortAnswer(
  quizSessionId: string,
  questionId: string,
  answerText: string,
  provider: LlmProviderName
): Promise<ShortAnswerGrade> {
  const { data, error } = await supabase.functions.invoke("grade-short-answer", {
    body: { quizSessionId, questionId, answerText, provider },
  })

  if (error) throw new Error(await extractFunctionErrorMessage(error))

  return data as ShortAnswerGrade
}

/** 세션 완료 시 실제 기록된 답안을 집계해 quiz_sessions.correct_count를 갱신한다 */
export async function completeQuizSession(sessionId: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from("user_answers")
    .select("*", { count: "exact", head: true })
    .eq("quiz_session_id", sessionId)
    .eq("is_correct", true)

  if (countError) throw new Error(countError.message)

  const { error: updateError } = await supabase
    .from("quiz_sessions")
    .update({ correct_count: count ?? 0 })
    .eq("id", sessionId)

  if (updateError) throw new Error(updateError.message)
}

/** 로그인한 사용자의 전체 퀴즈 세션을 최신순으로 조회한다 (RLS로 소유자 데이터만 반환) */
export async function fetchQuizSessions(): Promise<QuizSession[]> {
  const { data, error } = await supabase.from("quiz_sessions").select("*").order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data as QuizSessionRow[]).map(rowToQuizSession)
}

/** 로그인한 사용자의 전체 오답(is_correct=false) 개수를 집계한다 (RLS로 소유자 데이터만 집계) */
export async function fetchWrongAnswerCount(): Promise<number> {
  const { count, error } = await supabase
    .from("user_answers")
    .select("*", { count: "exact", head: true })
    .eq("is_correct", false)

  if (error) throw new Error(error.message)

  return count ?? 0
}

export interface QuizSessionDetail {
  session: QuizSession
  questions: CsQuestion[]
  answers: UserAnswer[]
}

/** 완료된(또는 진행 중인) 퀴즈 세션의 상세(문항+답안)를 조회한다 */
export async function fetchQuizSessionDetail(sessionId: string): Promise<QuizSessionDetail | null> {
  const { data: sessionRow, error: sessionError } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle()

  if (sessionError) throw new Error(sessionError.message)
  if (!sessionRow) return null

  const { data: answerRows, error: answersError } = await supabase
    .from("user_answers")
    .select("*")
    .eq("quiz_session_id", sessionId)

  if (answersError) throw new Error(answersError.message)

  const answers = (answerRows as UserAnswerRow[]).map(rowToUserAnswer)
  const questionIds = answers.map((answer) => answer.questionId)

  const { data: questionRows, error: questionsError } =
    questionIds.length > 0
      ? await supabase.from("cs_questions").select("*").in("id", questionIds)
      : { data: [] as CsQuestionRow[], error: null }

  if (questionsError) throw new Error(questionsError.message)

  return {
    session: rowToQuizSession(sessionRow as QuizSessionRow),
    questions: (questionRows as CsQuestionRow[]).map(rowToCsQuestion),
    answers,
  }
}
