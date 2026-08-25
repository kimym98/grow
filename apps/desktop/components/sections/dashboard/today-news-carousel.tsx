"use client";

import { useMemo, useState } from "react";
import { isToday, parseISO } from "date-fns";
import { createTechNewsFixtures } from "@app/shared";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { NewsCard } from "@/components/sections/news/news-card";

/** 오늘 뉴스가 없을 때 폴백으로 보여줄 최근 뉴스 개수 */
const FALLBACK_COUNT = 6;

/**
 * 대시보드 상단에 표시되는 "오늘의 뉴스" 캐러셀
 * 당일(isToday) 뉴스만 필터링해 노출하고, 0건이면 최근순 상위 N개로 폴백한다.
 */
function TodayNewsCarousel() {
  const [newsList, setNewsList] = useState(() => createTechNewsFixtures(12));

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

  function toggleBookmark(id: string) {
    setNewsList((prev) =>
      prev.map((news) =>
        news.id === id ? { ...news, isBookmarked: !news.isBookmarked } : news,
      ),
    );
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
