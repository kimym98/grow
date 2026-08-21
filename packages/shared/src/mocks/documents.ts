// 임시 목업 타입 - Task 008에서 packages/shared/types의 공식 DocumentReview 타입으로 대체 예정
export interface DocumentReviewVersion {
  version: number
  createdAt: string
  summary: string
}

export interface DocumentDiffSegment {
  type: "unchanged" | "added" | "removed"
  text: string
}

export interface DocumentReviewComment {
  id: string
  quote: string
  comment: string
}

export interface DocumentReviewFixture {
  id: string
  title: string
  type: "resume" | "portfolio"
  status: "pending" | "processing" | "completed" | "failed"
  version: number
  updatedAt: string
  resumeQuestion?: string
  versions: DocumentReviewVersion[]
  diffSegments: DocumentDiffSegment[]
  comments: DocumentReviewComment[]
}

const TITLES = ["자기소개서 - 성장 과정", "자기소개서 - 지원 동기", "포트폴리오 - 프로젝트 A", "포트폴리오 - 프로젝트 B"]
const STATUSES: DocumentReviewFixture["status"][] = ["pending", "processing", "completed", "failed"]
const RESUME_QUESTIONS = [
  "본인의 성장 과정과 그 과정에서 얻은 가치관을 서술하시오.",
  "지원 동기와 입사 후 이루고 싶은 목표를 서술하시오.",
]
const DIFF_SAMPLES: DocumentDiffSegment[][] = [
  [
    { type: "unchanged", text: "저는 대학 시절부터 " },
    { type: "removed", text: "다양한 " },
    { type: "added", text: "실무 중심의 " },
    { type: "unchanged", text: "프로젝트 경험을 쌓아왔습니다. " },
    { type: "added", text: "특히 협업 과정에서 문제 해결 능력을 길렀습니다." },
  ],
  [
    { type: "unchanged", text: "이 프로젝트에서 저는 " },
    { type: "removed", text: "백엔드 개발을 담당했습니다." },
    { type: "added", text: "백엔드 API 설계와 성능 최적화를 주도적으로 담당했습니다." },
  ],
]
const COMMENT_SAMPLES: Omit<DocumentReviewComment, "id">[] = [
  { quote: "다양한 프로젝트 경험", comment: "구체적인 프로젝트명과 성과를 함께 제시하면 설득력이 높아집니다." },
  { quote: "백엔드 개발을 담당했습니다", comment: "담당 역할을 더 구체적인 기술/성과 중심으로 서술해 보세요." },
  { quote: "문제 해결 능력", comment: "어떤 문제를 어떻게 해결했는지 예시를 추가하면 좋습니다." },
]

function createVersionsFixture(seed: number): DocumentReviewVersion[] {
  const count = (seed % 3) + 1

  return Array.from({ length: count }, (_, index) => {
    const version = index + 1
    const createdAt = new Date(Date.now() - (count - index) * 24 * 60 * 60 * 1000)

    return {
      version,
      createdAt: createdAt.toISOString().slice(0, 10),
      summary: version === count ? "최신 첨삭 반영본" : `${version}차 초안`,
    }
  })
}

function createCommentsFixture(seed: number): DocumentReviewComment[] {
  const count = (seed % COMMENT_SAMPLES.length) + 1

  return Array.from({ length: count }, (_, index) => {
    const sample = COMMENT_SAMPLES[(seed + index) % COMMENT_SAMPLES.length]

    return {
      id: `document-${seed}-comment-${index + 1}`,
      ...sample,
    }
  })
}

/**
 * 문서 첨삭 더미 데이터를 생성한다.
 * @param count 생성할 개수 (기본 6)
 */
export function createDocumentReviewFixtures(count = 6): DocumentReviewFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1
    const updatedAt = new Date(Date.now() - seed * 12 * 60 * 60 * 1000)
    const type: DocumentReviewFixture["type"] = seed % 2 === 0 ? "portfolio" : "resume"

    return {
      id: `document-${seed}`,
      title: `${TITLES[seed % TITLES.length]} ${seed}`,
      type,
      status: STATUSES[seed % STATUSES.length],
      version: (seed % 3) + 1,
      updatedAt: updatedAt.toISOString().slice(0, 10),
      resumeQuestion: type === "resume" ? RESUME_QUESTIONS[seed % RESUME_QUESTIONS.length] : undefined,
      versions: createVersionsFixture(seed),
      diffSegments: DIFF_SAMPLES[seed % DIFF_SAMPLES.length],
      comments: createCommentsFixture(seed),
    }
  })
}
