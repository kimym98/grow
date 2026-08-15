// 임시 목업 타입 - Task 008에서 packages/shared/types의 공식 CsQuestion/QuizSession 타입으로 대체 예정
export interface CsQuestionFixture {
  id: string
  category: "network" | "database" | "os" | "data-structure"
  question: string
  answer: string
}

export interface QuizSessionFixture {
  id: string
  category: CsQuestionFixture["category"]
  totalCount: number
  correctCount: number
  createdAt: string
}

const CATEGORIES: CsQuestionFixture["category"][] = ["network", "database", "os", "data-structure"]

/**
 * CS 면접 퀴즈 문제 더미 데이터를 생성한다.
 * @param count 생성할 개수 (기본 20)
 */
export function createCsQuestionFixtures(count = 20): CsQuestionFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1

    return {
      id: `question-${seed}`,
      category: CATEGORIES[seed % CATEGORIES.length],
      question: `CS 면접 질문 ${seed}`,
      answer: `CS 면접 질문 ${seed}에 대한 모범 답안`,
    }
  })
}

/**
 * 퀴즈 풀이 세션 더미 데이터를 생성한다.
 * @param count 생성할 개수 (기본 5)
 */
export function createQuizSessionFixtures(count = 5): QuizSessionFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1
    const createdAt = new Date(Date.now() - seed * 24 * 60 * 60 * 1000)
    const totalCount = 10

    return {
      id: `quiz-session-${seed}`,
      category: CATEGORIES[seed % CATEGORIES.length],
      totalCount,
      correctCount: (seed * 3) % (totalCount + 1),
      createdAt: createdAt.toISOString().slice(0, 10),
    }
  })
}
