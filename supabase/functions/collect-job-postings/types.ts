/**
 * 수집 소스가 공통으로 반환하는 정규화된 채용 공고 형태.
 * job_postings 테이블 컬럼(snake_case)과의 매핑은 upsert 시점에 처리한다.
 */
export interface NormalizedJobPosting {
  title: string
  company: string
  location: string
  careerLevel: string
  /** ISO 날짜 문자열(YYYY-MM-DD). 상시채용 등 마감일이 없는 경우 null */
  deadline: string | null
  tags: string[]
  url: string
  /** upsert 고유키. job_postings.source_url UNIQUE 제약과 매핑 */
  sourceUrl: string
  /** 수집 플랫폼 구분(예: "jobkorea"). job_postings.source 컬럼과 매핑 */
  source: string
}

/** 소스 어댑터 공통 시그니처. 필요한 환경변수(API 키)가 없으면 빈 배열을 반환해 조용히 스킵한다 */
export type JobPostingSource = {
  name: string
  fetchAll: () => Promise<NormalizedJobPosting[]>
}
