export * from "./mocks/news"
export * from "./mocks/quiz"

// mocks/schedules, mocks/documents는 공식 타입(./types)과 이름이 겹치는
// 임시 타입(ScheduleChecklistItem, DocumentReviewVersion, DocumentReviewComment)을
// 포함하므로, mocks 파일 수정 없이 배럴에서만 명시적으로 골라 export한다.
export type { ScheduleFixture } from "./mocks/schedules"
export { createScheduleFixtures } from "./mocks/schedules"

export type { DocumentDiffSegment, DocumentReviewFixture } from "./mocks/documents"
export { createDocumentReviewFixtures } from "./mocks/documents"

export * from "./schemas/job-posting"
export * from "./schemas/schedule"
export * from "./schemas/tech-news"
export * from "./schemas/document-review"
export * from "./schemas/cs-question"
export * from "./schemas/quiz-session"

export * from "./types/job-posting"
export * from "./types/schedule"
export * from "./types/tech-news"
export * from "./types/document-review"
export * from "./types/cs-question"
export * from "./types/quiz-session"
export * from "./types/common"
export * from "./types/llm-provider"
export * from "./types/notification-trigger"

export * from "./lib/supabase-client"
export * from "./lib/job-posting-mapper"
export * from "./lib/schedule-mapper"
export * from "./lib/notification-trigger"
