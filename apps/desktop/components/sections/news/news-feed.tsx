"use client"

import { useState } from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { createTechNewsFixtures } from "@app/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function NewsFeed() {
  const [newsList, setNewsList] = useState(() => createTechNewsFixtures(8))

  function toggleBookmark(id: string) {
    setNewsList((prev) =>
      prev.map((news) =>
        news.id === id ? { ...news, isBookmarked: !news.isBookmarked } : news
      )
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {newsList.map((news) => (
        <Card key={news.id}>
          <CardHeader>
            <Badge variant="outline">{news.source}</Badge>
            <CardTitle>
              <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {news.title}
              </a>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CardDescription>{news.summary}</CardDescription>
          </CardContent>

          <CardFooter className="justify-between">
            <span className="text-xs text-muted-foreground">{news.publishedAt}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={news.isBookmarked}
              aria-label={news.isBookmarked ? "북마크 해제" : "북마크 추가"}
              onClick={() => toggleBookmark(news.id)}
            >
              {news.isBookmarked ? (
                <BookmarkCheck className="text-primary" />
              ) : (
                <Bookmark />
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export { NewsFeed }
