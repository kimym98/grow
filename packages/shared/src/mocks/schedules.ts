// 임시 목업 타입 - Task 008에서 packages/shared/types의 공식 Schedule 타입으로 대체 예정
export interface ScheduleFixture {
  id: string
  title: string
  memo?: string
  date: string
  time?: string
  category: "interview" | "deadline" | "study" | "etc"
  isRecurring: boolean
}

const TITLES = ["기술 면접", "서류 마감", "CS 스터디", "포트폴리오 회고", "코딩테스트"]
const CATEGORIES: ScheduleFixture["category"][] = ["interview", "deadline", "study", "etc"]

/**
 * 일정 더미 데이터를 생성한다.
 * @param count 생성할 개수 (기본 10)
 */
export function createScheduleFixtures(count = 10): ScheduleFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1
    const date = new Date(Date.now() + seed * 24 * 60 * 60 * 1000)

    return {
      id: `schedule-${seed}`,
      title: `${TITLES[seed % TITLES.length]} ${seed}`,
      memo: seed % 2 === 0 ? `메모 ${seed}` : undefined,
      date: date.toISOString().slice(0, 10),
      time: seed % 3 === 0 ? "14:00" : undefined,
      category: CATEGORIES[seed % CATEGORIES.length],
      isRecurring: seed % 4 === 0,
    }
  })
}
