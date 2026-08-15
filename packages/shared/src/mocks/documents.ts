// 임시 목업 타입 - Task 008에서 packages/shared/types의 공식 DocumentReview 타입으로 대체 예정
export interface DocumentReviewFixture {
  id: string
  title: string
  type: "resume" | "portfolio"
  status: "pending" | "processing" | "completed" | "failed"
  version: number
  updatedAt: string
}

const TITLES = ["자기소개서 - 성장 과정", "자기소개서 - 지원 동기", "포트폴리오 - 프로젝트 A", "포트폴리오 - 프로젝트 B"]
const STATUSES: DocumentReviewFixture["status"][] = ["pending", "processing", "completed", "failed"]

/**
 * 문서 첨삭 더미 데이터를 생성한다.
 * @param count 생성할 개수 (기본 6)
 */
export function createDocumentReviewFixtures(count = 6): DocumentReviewFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1
    const updatedAt = new Date(Date.now() - seed * 12 * 60 * 60 * 1000)

    return {
      id: `document-${seed}`,
      title: `${TITLES[seed % TITLES.length]} ${seed}`,
      type: seed % 2 === 0 ? "portfolio" : "resume",
      status: STATUSES[seed % STATUSES.length],
      version: (seed % 3) + 1,
      updatedAt: updatedAt.toISOString().slice(0, 10),
    }
  })
}
