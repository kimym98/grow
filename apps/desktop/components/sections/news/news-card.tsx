"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { TechNews } from "@app/shared";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NewsCardProps {
  /** 뉴스 아이템 데이터 */
  news: TechNews;
  /** 북마크 토글 콜백 (뉴스 id 전달) */
  onToggleBookmark?: (id: string) => void;
  /** 카드 루트에 추가할 클래스 */
  className?: string;
  /** 카드 배경색 (랜덤 팔레트에서 선택) */
  backgroundColor?: string;
}

/**
 * 개별 뉴스 카드 마크업 (Badge + 제목 링크 + 요약 + 북마크 버튼)
 * news-feed, today-news-carousel 등에서 재사용
 */
function NewsCard({
  news,
  onToggleBookmark,
  className,
  backgroundColor,
}: NewsCardProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const appliedBackgroundColor =
    mounted && resolvedTheme !== "dark" ? backgroundColor : undefined;

  return (
    <Card
      className={cn("flex h-full flex-col", className)}
      style={
        appliedBackgroundColor
          ? { backgroundColor: appliedBackgroundColor }
          : undefined
      }
    >
      <CardHeader className="flex flex-col items-start gap-4">
        <Badge
          variant="outline"
          className="w-fit border-black/50 dark:border-white/50"
        >
          {news.source}
        </Badge>
        <CardTitle>
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 hover:underline"
          >
            {news.title}
          </a>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="line-clamp-2">
          {news.summary}
        </CardDescription>
      </CardContent>

      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {news.publishedAt}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-pressed={news.isBookmarked}
          aria-label={news.isBookmarked ? "북마크 해제" : "북마크 추가"}
          onClick={() => onToggleBookmark?.(news.id)}
        >
          {news.isBookmarked ? (
            <BookmarkCheck className="text-primary" />
          ) : (
            <Bookmark />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export { NewsCard };
export type { NewsCardProps };
