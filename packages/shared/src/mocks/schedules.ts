// 임시 목업 타입 - Task 008에서 packages/shared/types의 공식 Schedule 타입으로 대체 예정
export interface ScheduleChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface ScheduleFixture {
  id: string
  title: string
  memo?: string
  date: string
  time?: string
  reminderTime?: string
  category: "interview" | "deadline" | "study" | "etc"
  isRecurring: boolean
  checklist?: ScheduleChecklistItem[]
}

const TITLES = ["기술 면접", "서류 마감", "CS 스터디", "포트폴리오 회고", "코딩테스트"]
const CATEGORIES: ScheduleFixture["category"][] = ["interview", "deadline", "study", "etc"]
const CHECKLIST_LABELS = ["이력서 최신화", "포트폴리오 점검", "예상 질문 정리", "복장 준비", "이동 경로 확인"]

function createChecklistFixture(seed: number): ScheduleChecklistItem[] {
  const count = (seed % 3) + 1

  return Array.from({ length: count }, (_, index) => {
    const labelIndex = (seed + index) % CHECKLIST_LABELS.length

    return {
      id: `schedule-${seed}-checklist-${index + 1}`,
      label: CHECKLIST_LABELS[labelIndex],
      done: (seed + index) % 2 === 0,
    }
  })
}

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
      reminderTime: seed % 3 === 0 ? "09:00" : undefined,
      category: CATEGORIES[seed % CATEGORIES.length],
      isRecurring: seed % 4 === 0,
      checklist: seed % 2 === 0 ? createChecklistFixture(seed) : undefined,
    }
  })
}
