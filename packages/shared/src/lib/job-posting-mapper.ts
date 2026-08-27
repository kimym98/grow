import type { JobPosting } from "../types/job-posting"

/**
 * Supabase job_postings 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 docs/database-schema.md 참고
 */
export interface JobPostingRow {
  id: string
  title: string
  company: string
  location: string
  career_level: string
  deadline: string | null
  tags: string[]
  url: string
  source_url: string
  source: string
  created_at: string
  updated_at: string
}

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 * 반대 방향(도메인 -> row) 변환은 Edge Function 내부에서 자체 처리한다.
 */
export function rowToJobPosting(row: JobPostingRow): JobPosting {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    careerLevel: row.career_level,
    deadline: row.deadline,
    tags: row.tags,
    url: row.url,
    sourceUrl: row.source_url,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
