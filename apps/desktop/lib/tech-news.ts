import { rowToTechNews, type TechNews, type TechNewsRow } from "@app/shared"

import { supabase } from "@/lib/supabase"

/**
 * tech_news 테이블에서 전체 뉴스를 발행일 최신순으로 조회하고,
 * 로그인한 사용자의 tech_news_bookmarks를 별도로 조회해 isBookmarked를 채운다.
 * (RLS가 tech_news_bookmarks를 소유자 데이터로 제한하므로 비로그인 시 빈 배열이 반환된다)
 */
export async function fetchTechNews(): Promise<TechNews[]> {
  const { data: newsRows, error: newsError } = await supabase
    .from("tech_news")
    .select("*")
    .order("published_at", { ascending: false })

  if (newsError) throw new Error(newsError.message)

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? null

  let bookmarkedNewsIds = new Set<string>()
  if (userId) {
    const { data: bookmarkRows, error: bookmarkError } = await supabase
      .from("tech_news_bookmarks")
      .select("news_id")
      .eq("user_id", userId)

    if (bookmarkError) throw new Error(bookmarkError.message)
    bookmarkedNewsIds = new Set((bookmarkRows ?? []).map((row) => row.news_id as string))
  }

  return (newsRows as TechNewsRow[]).map((row) => rowToTechNews(row, bookmarkedNewsIds, userId))
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
