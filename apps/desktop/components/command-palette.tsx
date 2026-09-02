"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { StarIcon, BriefcaseIcon, NewspaperIcon, FileTextIcon, BrainIcon, ClockIcon } from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { fetchJobPostings } from "@/lib/job-postings"
import { fetchTechNews } from "@/lib/tech-news"
import { fetchDocumentReviews } from "@/lib/document-reviews"
import { fetchQuizSessions, QUIZ_CATEGORY_LABELS } from "@/lib/quiz"
import {
  useRecentFavoritesStore,
  type RecentFavoriteItem,
} from "@/lib/stores/recent-favorites-store"

/** 검색 대상 데이터를 lib 조회 함수로 가져와 커맨드팔레트용 항목 목록으로 변환한다 */
async function loadSearchItems(): Promise<RecentFavoriteItem[]> {
  const [jobPostings, techNews, documentReviews, quizSessions] = await Promise.all([
    fetchJobPostings().catch(() => []),
    fetchTechNews().catch(() => []),
    fetchDocumentReviews().catch(() => []),
    fetchQuizSessions().catch(() => []),
  ])

  return [
    ...jobPostings.map(
      (job): RecentFavoriteItem => ({
        key: `job:${job.id}`,
        type: "job",
        id: job.id,
        title: job.title,
        subtitle: job.company,
        href: `/jobs?id=${job.id}`,
      })
    ),
    ...techNews.map(
      (news): RecentFavoriteItem => ({
        key: `news:${news.id}`,
        type: "news",
        id: news.id,
        title: news.title,
        subtitle: news.source,
        href: `/news`,
      })
    ),
    ...documentReviews.map(
      (doc): RecentFavoriteItem => ({
        key: `document:${doc.id}`,
        type: "document",
        id: doc.id,
        title: doc.title,
        subtitle: doc.type === "resume" ? "이력서" : "포트폴리오",
        href: `/documents?id=${doc.id}`,
      })
    ),
    ...quizSessions.map(
      (session): RecentFavoriteItem => ({
        key: `quiz:${session.id}`,
        type: "quiz",
        id: session.id,
        title: `${QUIZ_CATEGORY_LABELS[session.category] ?? session.category} 퀴즈 세션`,
        subtitle: `${session.correctCount}/${session.totalCount} 정답`,
        href: `/quiz?session=${session.id}`,
      })
    ),
  ]
}

const TYPE_ICONS = {
  job: BriefcaseIcon,
  news: NewspaperIcon,
  document: FileTextIcon,
  quiz: BrainIcon,
} as const

const TYPE_LABELS = {
  job: "채용 공고",
  news: "IT 뉴스",
  document: "문서 첨삭",
  quiz: "CS 퀴즈",
} as const

function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<RecentFavoriteItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { recentItems, favoriteItems, addRecent, toggleFavorite, isFavorite } = useRecentFavoritesStore()

  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)

      if (nextOpen && items === null && !isLoading) {
        setIsLoading(true)
        loadSearchItems()
          .then(setItems)
          .finally(() => setIsLoading(false))
      }
    },
    [items, isLoading]
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        handleOpenChange(!openRef.current)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleOpenChange])

  const handleSelect = useCallback(
    (item: RecentFavoriteItem) => {
      addRecent(item)
      setOpen(false)
      router.push(item.href)
    },
    [addRecent, router]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="전역 검색"
      description="공고, 뉴스, 문서, 퀴즈를 검색합니다"
    >
      <Command>
        <CommandInput placeholder="검색어를 입력하세요... (공고, 뉴스, 문서, 퀴즈)" />
        <CommandList>
          <CommandEmpty>{isLoading ? "불러오는 중..." : "검색 결과가 없습니다"}</CommandEmpty>

          {favoriteItems.length > 0 && (
            <CommandGroup heading="즐겨찾기">
              {favoriteItems.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${item.title} ${item.subtitle ?? ""}`}
                  onSelect={() => handleSelect(item)}
                >
                  <StarIcon className="fill-current text-amber-500" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {recentItems.length > 0 && (
            <CommandGroup heading="최근 조회">
              {recentItems.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${item.title} ${item.subtitle ?? ""}`}
                  onSelect={() => handleSelect(item)}
                >
                  <ClockIcon />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {(["job", "news", "document", "quiz"] as const).map((type) => {
            const groupItems = (items ?? []).filter((item) => item.type === type)
            if (groupItems.length === 0) return null

            const Icon = TYPE_ICONS[type]

            return (
              <CommandGroup key={type} heading={TYPE_LABELS[type]}>
                {groupItems.map((item) => (
                  <CommandItem
                    key={item.key}
                    value={`${item.title} ${item.subtitle ?? ""}`}
                    onSelect={() => handleSelect(item)}
                  >
                    <Icon />
                    <span>{item.title}</span>
                    {item.subtitle && <span className="text-muted-foreground">{item.subtitle}</span>}
                    <button
                      type="button"
                      className="ml-auto opacity-0 group-hover/command-item:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleFavorite(item)
                      }}
                      aria-label="즐겨찾기 토글"
                    >
                      <StarIcon className={isFavorite(item.key) ? "fill-current text-amber-500" : ""} />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

export { CommandPalette }
