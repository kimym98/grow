import { rowToTechNews, type TechNews, type TechNewsRow } from "@app/shared"

import { supabase } from "@/lib/supabase"

/** 무한 스크롤에서 한 번에 불러올 뉴스 개수 */
export const TECH_NEWS_PAGE_SIZE = 30

/** 기존 fetchTechNews() 호출부(커맨드팔레트, 대시보드 위젯 등)에서 쓰는 기본 조회 개수 */
const DEFAULT_PAGE_SIZE = 200

export interface FetchTechNewsParams {
  /** 0-based 페이지 인덱스 */
  page?: number
  pageSize?: number
  search?: string
}

/**
 * tech_news 테이블을 발행일 최신순으로 페이지 단위 조회하고,
 * 로그인한 사용자의 해당 페이지 북마크 여부를 채운다.
 * (RLS가 tech_news_bookmarks를 소유자 데이터로 제한하므로 비로그인 시 빈 배열이 반환된다)
 */
export async function fetchTechNews(params: FetchTechNewsParams = {}): Promise<TechNews[]> {
  const { page = 0, pageSize = DEFAULT_PAGE_SIZE, search } = params

  let query = supabase.from("tech_news").select("*")

  const keyword = search?.trim()
  if (keyword) {
    const escaped = keyword.replace(/[%,]/g, "")
    query = query.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%,source.ilike.%${escaped}%`)
  }

  const from = page * pageSize
  const { data: newsRows, error: newsError } = await query
    .order("published_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1)

  if (newsError) throw new Error(newsError.message)

  const rows = newsRows as TechNewsRow[]

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? null

  let bookmarkedNewsIds = new Set<string>()
  if (userId && rows.length > 0) {
    const { data: bookmarkRows, error: bookmarkError } = await supabase
      .from("tech_news_bookmarks")
      .select("news_id")
      .eq("user_id", userId)
      .in("news_id", rows.map((row) => row.id))

    if (bookmarkError) throw new Error(bookmarkError.message)
    bookmarkedNewsIds = new Set((bookmarkRows ?? []).map((row) => row.news_id as string))
  }

  return rows.map((row) => rowToTechNews(row, bookmarkedNewsIds, userId))
}

/** 뉴스를 북마크한다 (user_id는 현재 로그인 세션에서 획득) */
export async function bookmarkTechNews(newsId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const { error } = await supabase
    .from("tech_news_bookmarks")
    .upsert({ user_id: userData.user.id, news_id: newsId }, { onConflict: "user_id,news_id" })

  if (error) throw new Error(error.message)
}

/** 뉴스 북마크를 해제한다 */
export async function unbookmarkTechNews(newsId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const { error } = await supabase
    .from("tech_news_bookmarks")
    .delete()
    .eq("user_id", userData.user.id)
    .eq("news_id", newsId)

  if (error) throw new Error(error.message)
}
