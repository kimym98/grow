// 임시 목업 타입 - Task 008에서 packages/shared/types의 공식 JobPosting 타입으로 대체 예정
export interface JobPostingFixture {
  id: string
  title: string
  company: string
  location: string
  careerLevel: string
  deadline: string
  tags: string[]
  url: string
}

const COMPANIES = ["네이버", "카카오", "토스", "당근", "쿠팡", "라인"]
const LOCATIONS = ["서울 강남구", "서울 판교", "경기 성남시", "서울 마포구"]
const CAREER_LEVELS = ["신입", "경력 1~3년", "경력 3~5년", "경력무관"]
const TAG_POOL = ["Frontend", "Backend", "React", "Node.js", "TypeScript", "AI", "클라우드"]

function pick<T>(pool: T[], seed: number) {
  return pool[seed % pool.length]
}

/**
 * 채용 공고 더미 데이터를 생성한다.
 * @param count 생성할 개수 (기본 12)
 */
export function createJobPostingFixtures(count = 12): JobPostingFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1
    const deadline = new Date(Date.now() + seed * 24 * 60 * 60 * 1000)

    return {
      id: `job-${seed}`,
      title: `${pick(COMPANIES, seed)} ${pick(CAREER_LEVELS, seed)} 채용 ${seed}`,
      company: pick(COMPANIES, seed),
      location: pick(LOCATIONS, seed),
      careerLevel: pick(CAREER_LEVELS, seed),
      deadline: deadline.toISOString().slice(0, 10),
      tags: [pick(TAG_POOL, seed), pick(TAG_POOL, seed + 1)],
      url: `https://example.com/jobs/${seed}`,
    }
  })
}
