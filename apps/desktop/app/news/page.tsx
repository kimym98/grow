import { NewsFeed } from "@/components/sections/news/news-feed"

export default function NewsPage() {
  return (
    <div>
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-semibold">뉴스</h1>
        <p className="mt-2 text-muted-foreground">
          IT 업계 소식을 카드로 확인하고 관심 있는 글을 북마크하세요.
        </p>
      </div>

      <NewsFeed />
    </div>
  )
}
