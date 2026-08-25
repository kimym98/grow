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

  const cardColorMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((news) => {
      const randomColor =
        CARD_BACKGROUND_COLORS[
          Math.floor(Math.random() * CARD_BACKGROUND_COLORS.length)
        ];
      map.set(news.id, randomColor);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((news) => news.id).join(",")]);

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
