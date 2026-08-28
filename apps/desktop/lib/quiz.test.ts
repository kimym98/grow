import { beforeEach, describe, expect, it, vi } from "vitest"

const fromMock = vi.fn()
const invokeMock = vi.fn()

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    functions: { invoke: (name: string, options: unknown) => invokeMock(name, options) },
  },
}))

/** supabase-js 쿼리 빌더처럼 메서드 체이닝 후 await 시점에 result로 resolve되는 thenable을 만든다 */
function makeQueryChain(result: unknown) {
  const chain: Record<string, unknown> = {
    upsert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    then: (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled),
  }
  return chain
}

const { recordMultipleChoiceAnswer, completeQuizSession, gradeShortAnswer, QUIZ_CATEGORY_LABELS } = await import(
  "@/lib/quiz"
)

describe("QUIZ_CATEGORY_LABELS", () => {
  it("7개 카테고리 모두 한국어 라벨을 갖는다", () => {
    expect(Object.keys(QUIZ_CATEGORY_LABELS)).toHaveLength(7)
    expect(QUIZ_CATEGORY_LABELS.network).toBe("네트워크")
    expect(QUIZ_CATEGORY_LABELS.mixed).toBe("모의고사")
  })
})

describe("recordMultipleChoiceAnswer", () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it("upsert가 성공하면 에러 없이 완료된다", async () => {
    fromMock.mockReturnValue(makeQueryChain({ error: null }))

    await expect(recordMultipleChoiceAnswer("session-1", "question-1", 2, true)).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith("user_answers")
  })

  it("upsert가 실패하면 Supabase 에러 메시지로 예외를 던진다", async () => {
    fromMock.mockReturnValue(makeQueryChain({ error: { message: "RLS 위반" } }))

    await expect(recordMultipleChoiceAnswer("session-1", "question-1", 2, true)).rejects.toThrow("RLS 위반")
  })
})

describe("completeQuizSession", () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it("정답 개수를 집계해 quiz_sessions.correct_count를 갱신한다", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "user_answers") return makeQueryChain({ count: 3, error: null })
      return makeQueryChain({ error: null })
    })

    await expect(completeQuizSession("session-1")).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith("user_answers")
    expect(fromMock).toHaveBeenCalledWith("quiz_sessions")
  })

  it("집계 조회가 실패하면 갱신을 시도하지 않고 예외를 던진다", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "user_answers") return makeQueryChain({ count: null, error: { message: "집계 실패" } })
      return makeQueryChain({ error: null })
    })

    await expect(completeQuizSession("session-1")).rejects.toThrow("집계 실패")
    expect(fromMock).not.toHaveBeenCalledWith("quiz_sessions")
  })
})

describe("gradeShortAnswer", () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it("성공 응답을 그대로 반환한다", async () => {
    invokeMock.mockResolvedValue({
      data: { score: 85, feedback: "잘했습니다", isCorrect: true },
      error: null,
    })

    const result = await gradeShortAnswer("session-1", "question-1", "제 답변입니다", "gemini")

    expect(result).toEqual({ score: 85, feedback: "잘했습니다", isCorrect: true })
    expect(invokeMock).toHaveBeenCalledWith("grade-short-answer", {
      body: { quizSessionId: "session-1", questionId: "question-1", answerText: "제 답변입니다", provider: "gemini" },
    })
  })

  it("Edge Function 에러 응답의 message를 그대로 예외로 던진다", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: {
        context: new Response(JSON.stringify({ message: "등록된 gemini API 키가 없습니다" }), { status: 400 }),
      },
    })

    await expect(gradeShortAnswer("session-1", "question-1", "답변", "gemini")).rejects.toThrow(
      "등록된 gemini API 키가 없습니다"
    )
  })
})
