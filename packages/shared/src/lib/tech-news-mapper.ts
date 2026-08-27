import type { TechNews } from "../types/tech-news"

/**
 * Supabase tech_news 테이블의 DB row 형태 (snake_case)
 * 컬럼 정의는 docs/database-schema.md 참고
 */
export interface TechNewsRow {
  id: string
  title: string
  summary: string
  source: string
  published_at: string
  url: string
  created_at: string
  updated_at: string
}

/**
 * DB row(snake_case)를 도메인 타입(camelCase)으로 변환한다.
 * isBookmarked/userId는 tech_news_bookmarks 조인 결과를 별도로 조회해 채운다
 * (docs/database-schema.md: 북마크는 별도 테이블로 정규화되어 있음).
 */
export function rowToTechNews(
  row: TechNewsRow,
  bookmarkedNewsIds: ReadonlySet<string>,
  currentUserId: string | null
): TechNews {
  const isBookmarked = bookmarkedNewsIds.has(row.id)

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    source: row.source,
    publishedAt: row.published_at,
    url: row.url,
    isBookmarked,
    userId: isBookmarked ? currentUserId : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
