"use client"

import { memo, useCallback, useEffect, useMemo, useState, type ReactElement } from "react"
import { Search } from "lucide-react"
import { List, type RowComponentProps } from "react-window"
import type { TechNews } from "@app/shared"

import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingState } from "@/components/common/loading-state"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { bookmarkTechNews, fetchTechNews, TECH_NEWS_PAGE_SIZE, unbookmarkTechNews } from "@/lib/tech-news"

import { NewsCard } from "./news-card"

const NEWS_ROW_HEIGHT = 280

/** sm(640px)/lg(1024px) 브레이크포인트에서 grid-cols가 바뀌는 기존 레이아웃과 동일한 열 수를 계산한다 */
function useNewsColumnCount() {
  const [columnCount, setColumnCount] = useState(1)

  useEffect(() => {
    function updateColumnCount() {
      if (window.innerWidth >= 1024) setColumnCount(3)
      else if (window.innerWidth >= 640) setColumnCount(2)
      else setColumnCount(1)
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)
    return () => window.removeEventListener("resize", updateColumnCount)
  }, [])

  return columnCount
}

interface NewsRowProps {
  rows: TechNews[][]
  onToggleBookmark: (id: string) => void
  hasMore: boolean
  sentinelRef: (node: HTMLElement | null) => void
}

const NewsRow = memo(function NewsRow({
  index,
  style,
  rows,
  onToggleBookmark,
  hasMore,
  sentinelRef,
}: RowComponentProps<NewsRowProps>) {
  // rows 뒤에 추가된 마지막 index는 다음 페이지 로딩을 트리거하는 센티넬 row다
  if (index >= rows.length) {
    return (
      <div style={style} ref={hasMore ? sentinelRef : undefined} className="flex items-center justify-center px-1 pb-4">
        <LoadingState variant="list" count={1} />
      </div>
    )
  }

  const row = rows[index]

  return (
    <div style={style} className="grid auto-rows-fr grid-cols-1 gap-4 px-1 pb-4 sm:grid-cols-2 lg:grid-cols-3">
      {row.map((news) => (
        <NewsCard key={news.id} news={news} onToggleBookmark={onToggleBookmark} />
      ))}
    </div>
  )
}) as (props: RowComponentProps<NewsRowProps>) => ReactElement

function NewsFeed() {
  const [newsList, setNewsList] = useState<TechNews[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  // 검색어가 바뀌면 첫 페이지부터 다시 조회한다
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 검색어 변경 시 즉시 로딩 표시로 전환하기 위한 동기 초기화
    setIsLoading(true)
    setLoadError(null)

    fetchTechNews({ page: 0, pageSize: TECH_NEWS_PAGE_SIZE, search: debouncedSearch })
      .then((news) => {
        if (cancelled) return
        setNewsList(news)
        setPage(0)
        setHasMore(news.length === TECH_NEWS_PAGE_SIZE)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true)
    const nextPage = page + 1

    fetchTechNews({ page: nextPage, pageSize: TECH_NEWS_PAGE_SIZE, search: debouncedSearch })
      .then((news) => {
        setNewsList((prev) => [...prev, ...news])
        setPage(nextPage)
        setHasMore(news.length === TECH_NEWS_PAGE_SIZE)
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        setIsLoadingMore(false)
      })
  }, [page, debouncedSearch])

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore || isLoading,
    onLoadMore: handleLoadMore,
  })

  // isBookmarked 최신값 조회를 위해 newsList를 참조하는 부수효과(API 분기 호출)가 있어
  // 완전한 참조 안정화 대신 newsList를 의존성으로 명시한다
  const toggleBookmark = useCallback(
    async (id: string) => {
      const target = newsList.find((news) => news.id === id)
      if (!target) return

      try {
        if (target.isBookmarked) {
          await unbookmarkTechNews(id)
        } else {
          await bookmarkTechNews(id)
        }
        setNewsList((prev) =>
          prev.map((news) =>
            news.id === id ? { ...news, isBookmarked: !news.isBookmarked } : news
          )
        )
      } catch (error) {
        console.error("북마크 처리 실패:", error instanceof Error ? error.message : error)
      }
    },
    [newsList]
  )

  const columnCount = useNewsColumnCount()
  const newsRows = useMemo(() => {
    const rows: TechNews[][] = []
    for (let i = 0; i < newsList.length; i += columnCount) {
      rows.push(newsList.slice(i, i + columnCount))
    }
    return rows
  }, [newsList, columnCount])

  const rowCount = newsRows.length + (hasMore ? 1 : 0)

  const newsRowProps = useMemo(
    () => ({ rows: newsRows, onToggleBookmark: toggleBookmark, hasMore, sentinelRef }),
    [newsRows, toggleBookmark, hasMore, sentinelRef]
  )

  if (isLoading) {
    return <EmptyState title="뉴스를 불러오는 중입니다" description="잠시만 기다려주세요" />
  }

  if (loadError) {
    return <EmptyState title="뉴스를 불러오지 못했습니다" description={loadError} />
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 p-6">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="제목, 요약, 출처로 검색"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-9"
          aria-label="뉴스 검색"
        />
      </div>

      {newsList.length === 0 ? (
        <EmptyState
          title={searchQuery ? "검색 결과가 없습니다" : "표시할 뉴스가 없습니다"}
          description={searchQuery ? "다른 검색어로 다시 시도해보세요" : "잠시 후 다시 확인해주세요"}
        />
      ) : (
        <div className="min-h-0 flex-1">
          <List
            rowComponent={NewsRow}
            rowCount={rowCount}
            rowHeight={NEWS_ROW_HEIGHT}
            rowProps={newsRowProps}
          />
        </div>
      )}
    </div>
  )
}

export { NewsFeed }
