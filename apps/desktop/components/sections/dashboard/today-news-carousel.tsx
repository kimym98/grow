"use client";

import { useEffect, useMemo, useState } from "react";
import { isToday, parseISO } from "date-fns";
import type { TechNews } from "@app/shared";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { NewsCard } from "@/components/sections/news/news-card";
import { bookmarkTechNews, fetchTechNews, unbookmarkTechNews } from "@/lib/tech-news";

/** 오늘 뉴스가 없을 때 폴백으로 보여줄 최근 뉴스 개수 */
const FALLBACK_COUNT = 6;

/** 뉴스 카드 배경색 팔레트 */
const CARD_BACKGROUND_COLORS = [
  "#FFF6DF",
  "#F9E1D2",
  "#FFF1B8",
  "#F6CDC4",
  "#F8DDE3",
  "#F0E4F5",
  "#E6DDF4",
  "#F8F3EA",
  "#EFE4D6",
  "#DDE8D5",
  "#DDF2EA",
  "#DDEDF7",
  "#D7E3F4",
  "#FFFFFF",
];

/** news.id를 CARD_BACKGROUND_COLORS 인덱스로 결정적으로 매핑하는 해시 함수 */
function hashStringToIndex(value: string, modulo: number): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % modulo;
}

/**
 * 대시보드 상단에 표시되는 "오늘의 뉴스" 캐러셀
 * 당일(isToday) 뉴스만 필터링해 노출하고, 0건이면 최근순 상위 N개로 폴백한다.
 */
function TodayNewsCarousel() {
  const [newsList, setNewsList] = useState<TechNews[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchTechNews()
      .then((news) => {
        if (!cancelled) setNewsList(news);
      })
      .catch(() => {
        // 대시보드 위젯이라 실패 시 조용히 빈 목록으로 둔다(아래 items.length === 0 분기가 처리)
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { items, isFallback } = useMemo(() => {
    const todayNews = newsList.filter((news) =>
      isToday(parseISO(news.publishedAt)),
    );

    if (todayNews.length > 0) {
      return { items: todayNews, isFallback: false };
    }

    const recentNews = [...newsList]
      .sort(
        (a, b) =>
          parseISO(b.publishedAt).getTime() - parseISO(a.publishedAt).getTime(),
      )
      .slice(0, FALLBACK_COUNT);

    return { items: recentNews, isFallback: true };
  }, [newsList]);

  const cardColorMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((news) => {
      const color =
        CARD_BACKGROUND_COLORS[
          hashStringToIndex(news.id, CARD_BACKGROUND_COLORS.length)
        ];
      map.set(news.id, color);
    });
    return map;
  }, [items]);

  async function toggleBookmark(id: string) {
    const target = newsList.find((news) => news.id === id);
    if (!target) return;

    try {
      if (target.isBookmarked) {
        await unbookmarkTechNews(id);
      } else {
        await bookmarkTechNews(id);
      }
      setNewsList((prev) =>
        prev.map((news) =>
          news.id === id ? { ...news, isBookmarked: !news.isBookmarked } : news,
        ),
      );
    } catch (error) {
      console.error("북마크 처리 실패:", error instanceof Error ? error.message : error);
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        표시할 뉴스가 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-3">
      {isFallback ? (
        <p className="mb-2 text-sm text-muted-foreground">
          오늘 등록된 뉴스가 없어 최근 뉴스를 보여드려요
        </p>
      ) : null}

      <Carousel opts={{ align: "start" }} className="px-10 sm:px-12">
        <CarouselContent>
          {items.map((news) => (
            <CarouselItem
              key={news.id}
              className="basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <NewsCard
                news={news}
                onToggleBookmark={toggleBookmark}
                className="h-full border border-white/20"
                backgroundColor={cardColorMap.get(news.id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 bg-white" />
        <CarouselNext className="right-0 bg-white" />
      </Carousel>
    </div>
  );
}

export { TodayNewsCarousel };
