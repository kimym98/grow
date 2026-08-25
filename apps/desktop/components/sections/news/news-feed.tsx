"use client"

import { useState } from "react"
import { createTechNewsFixtures } from "@app/shared"

import { NewsCard } from "./news-card"

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
        <NewsCard key={news.id} news={news} onToggleBookmark={toggleBookmark} />
      ))}
    </div>
  )
}

export { NewsFeed }
