"use client"

import { memo, useCallback, useEffect, useMemo, useState, type ReactElement } from "react"
import { Search } from "lucide-react"
import { List, type RowComponentProps } from "react-window"
import type { TechNews } from "@app/shared"

import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/common/empty-state"
import { bookmarkTechNews, fetchTechNews, unbookmarkTechNews } from "@/lib/tech-news"

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
}

const NewsRow = memo(function NewsRow({
  index,
  style,
  rows,
  onToggleBookmark,
}: RowComponentProps<NewsRowProps>) {
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    let cancelled = false

    fetchTechNews()
      .then((news) => {
        if (!cancelled) setNewsList(news)
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
  }, [])

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

  const filteredNewsList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return newsList

    return newsList.filter((news) =>
      [news.title, news.summary, news.source].some((field) =>
        field.toLowerCase().includes(query)
      )
    )
  }, [newsList, searchQuery])

  const columnCount = useNewsColumnCount()
  const newsRows = useMemo(() => {
    const rows: TechNews[][] = []
    for (let i = 0; i < filteredNewsList.length; i += columnCount) {
      rows.push(filteredNewsList.slice(i, i + columnCount))
    }
    return rows
  }, [filteredNewsList, columnCount])

  const newsRowProps = useMemo(
    () => ({ rows: newsRows, onToggleBookmark: toggleBookmark }),
    [newsRows, toggleBookmark]
  )

  if (isLoading) {
    return <EmptyState title="뉴스를 불러오는 중입니다" description="잠시만 기다려주세요" />
  }

  if (loadError) {
    return <EmptyState title="뉴스를 불러오지 못했습니다" description={loadError} />
  }

  if (newsList.length === 0) {
    return <EmptyState title="표시할 뉴스가 없습니다" description="잠시 후 다시 확인해주세요" />
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

      {filteredNewsList.length === 0 ? (
        <EmptyState
          title="검색 결과가 없습니다"
          description="다른 검색어로 다시 시도해보세요"
        />
      ) : (
        <div className="min-h-0 flex-1">
          <List
            rowComponent={NewsRow}
            rowCount={newsRows.length}
            rowHeight={NEWS_ROW_HEIGHT}
            rowProps={newsRowProps}
          />
        </div>
      )}
    </div>
  )
}

export { NewsFeed }
