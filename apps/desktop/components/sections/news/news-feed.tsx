"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import type { TechNews } from "@app/shared"

import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/common/empty-state"
import { bookmarkTechNews, fetchTechNews, unbookmarkTechNews } from "@/lib/tech-news"

import { NewsCard } from "./news-card"

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

  async function toggleBookmark(id: string) {
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
  }

  const filteredNewsList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return newsList

    return newsList.filter((news) =>
      [news.title, news.summary, news.source].some((field) =>
        field.toLowerCase().includes(query)
      )
    )
  }, [newsList, searchQuery])

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
    <div className="flex flex-col gap-4 p-6">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNewsList.map((news) => (
            <NewsCard key={news.id} news={news} onToggleBookmark={toggleBookmark} />
          ))}
        </div>
      )}
    </div>
  )
}

export { NewsFeed }
