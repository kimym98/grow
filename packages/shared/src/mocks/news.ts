// 임시 목업 타입 - Task 008에서 packages/shared/types의 공식 TechNews 타입으로 대체 예정
export interface TechNewsFixture {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  url: string
  isBookmarked: boolean
}

const SOURCES = ["GeekNews", "요즘IT", "Toss Tech", "Kakao Tech", "AWS Blog"]

/**
 * IT 뉴스 더미 데이터를 생성한다.
 * @param count 생성할 개수 (기본 8)
 */
export function createTechNewsFixtures(count = 8): TechNewsFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1
    const publishedAt = new Date(Date.now() - seed * 24 * 60 * 60 * 1000)

    return {
      id: `news-${seed}`,
      title: `IT 업계 소식 ${seed}`,
      summary: `IT 업계 관련 요약 내용 ${seed}입니다.`,
      source: SOURCES[seed % SOURCES.length],
      publishedAt: publishedAt.toISOString().slice(0, 10),
      url: `https://example.com/news/${seed}`,
      isBookmarked: seed % 3 === 0,
    }
  })
}
