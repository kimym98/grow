/**
 * 수집 소스가 공통으로 반환하는 정규화된 뉴스 형태.
 * tech_news 테이블 컬럼(snake_case)과의 매핑은 upsert 시점에 처리한다.
 */
export interface NormalizedNewsItem {
  title: string
  summary: string
  /** 수집 매체 구분(예: "geeknews", "etnews"). tech_news.source 컬럼과 매핑 */
  source: string
  /** ISO 날짜 문자열(YYYY-MM-DD) */
  publishedAt: string
  /** upsert 고유키. tech_news.url UNIQUE 제약과 매핑 */
  url: string
}

/** 소스 어댑터 공통 시그니처 */
export type NewsSource = {
  name: string
  fetchAll: () => Promise<NormalizedNewsItem[]>
}
