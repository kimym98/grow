import { rowToJobPosting, type JobPosting, type JobPostingRow } from "@app/shared"

import { supabase } from "@/lib/supabase"

export type JobSortOption = "deadline" | "latest"

/** 무한 스크롤에서 한 번에 불러올 공고 개수 */
export const JOB_POSTINGS_PAGE_SIZE = 30

/** 검색어/기존 fetchJobPostings() 호출부(커맨드팔레트 등)에서 쓰는 기본 조회 개수 */
const DEFAULT_PAGE_SIZE = 200

export interface FetchJobPostingsParams {
  /** 0-based 페이지 인덱스 */
  page?: number
  pageSize?: number
  search?: string
  location?: string
  careerLevel?: string
  source?: string
  sort?: JobSortOption
}

/** job_postings 테이블을 페이지 단위로 조회한다. 반환 길이가 pageSize보다 작으면 더 이상 다음 페이지가 없다는 뜻이다 */
export async function fetchJobPostings(params: FetchJobPostingsParams = {}): Promise<JobPosting[]> {
  const {
    page = 0,
    pageSize = DEFAULT_PAGE_SIZE,
    search,
    location,
    careerLevel,
    source,
    sort = "latest",
  } = params

  let query = supabase.from("job_postings").select("*")

  const keyword = search?.trim()
  if (keyword) {
    const escaped = keyword.replace(/[%,]/g, "")
    query = query.or(`title.ilike.%${escaped}%,company.ilike.%${escaped}%`)
  }
  if (location && location !== "all") query = query.eq("location", location)
  if (careerLevel && careerLevel !== "all") query = query.eq("career_level", careerLevel)
  if (source && source !== "all") query = query.eq("source", source)

  query =
    sort === "deadline"
      ? query.order("deadline", { ascending: true, nullsFirst: false }).order("id", { ascending: true })
      : query.order("created_at", { ascending: false }).order("id", { ascending: true })

  const from = page * pageSize
  const { data, error } = await query.range(from, from + pageSize - 1)

  if (error) throw new Error(error.message)

  return (data as JobPostingRow[]).map(rowToJobPosting)
}

/** id로 공고 단건을 조회한다(목록 페이지에 없는 공고를 상세 패널에 표시할 때 사용) */
export async function fetchJobPostingById(id: string): Promise<JobPosting | null> {
  const { data, error } = await supabase.from("job_postings").select("*").eq("id", id).maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return rowToJobPosting(data as JobPostingRow)
}

export interface JobFilterOptions {
  locations: string[]
  careerLevels: string[]
  sources: string[]
}

/** 필터 select에 쓰일 지역/경력/사이트 옵션 목록을 distinct로 조회한다 */
export async function fetchJobFilterOptions(): Promise<JobFilterOptions> {
  const { data, error } = await supabase
    .from("job_postings")
    .select("location, career_level, source")

  if (error) throw new Error(error.message)

  const rows = data as { location: string; career_level: string; source: string }[]

  return {
    locations: Array.from(new Set(rows.map((row) => row.location).filter(Boolean))).sort(),
    careerLevels: Array.from(new Set(rows.map((row) => row.career_level).filter(Boolean))).sort(),
    sources: Array.from(new Set(rows.map((row) => row.source).filter(Boolean))).sort(),
  }
}
