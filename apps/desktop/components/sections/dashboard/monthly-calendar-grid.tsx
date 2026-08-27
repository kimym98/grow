"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Schedule } from "@app/shared";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** 일~토 요일 헤더 라벨 */
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 한 셀에 미리보기로 노출할 일정 최대 개수 (sm 이상) */
const MAX_PREVIEW_COUNT = 2;

interface MonthlyCalendarGridProps {
  /** 표시 대상 월 (해당 월의 아무 날짜나 전달) */
  month: Date;
  /** 날짜별 일정 목록 조회 함수 (실제 필터링 로직은 상위에서 주입) */
  getSchedulesForDate: (date: Date) => Schedule[];
  /** 현재 선택된 날짜 */
  selectedDate?: Date;
  /** 날짜 셀 클릭 콜백 */
  onSelectDate: (date: Date) => void;
  /** 이전/다음 달 이동, 오늘로 이동 시 호출 (헤더의 년/월 표시와 함께 사용) */
  onMonthChange?: (month: Date) => void;
  /** 루트 요소에 추가할 클래스 */
  className?: string;
}

/**
 * 노션 스타일의 큰 월간 캘린더 그리드 (6주 x 7일, 42칸)
 * 순수 프레젠테이션 컴포넌트 - 상태 관리/데이터 페칭은 상위 컨테이너에서 담당
 */
function MonthlyCalendarGrid({
  month,
  getSchedulesForDate,
  selectedDate,
  onSelectDate,
  onMonthChange,
  className,
}: MonthlyCalendarGridProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-2", className)}>
      {/* 년/월 헤더: 중앙 정렬 + 좌우에 이전/다음 달 이동 화살표 배치 */}
      <div className="flex shrink-0 items-center justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 sm:size-8"
          aria-label="이전 달"
          onClick={() => onMonthChange?.(subMonths(monthStart, 1))}
        >
          <ChevronLeft />
        </Button>
        <h3 className="min-w-24 text-center text-base font-semibold sm:min-w-28 sm:text-lg">
          {format(monthStart, "yyyy년 M월", { locale: ko })}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 sm:size-8"
          aria-label="다음 달"
          onClick={() => onMonthChange?.(addMonths(monthStart, 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid shrink-0 grid-cols-7 gap-1 px-1 text-center text-xs font-medium text-muted-foreground sm:text-sm">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} aria-hidden="true">
            {label}
          </div>
        ))}
      </div>

      {/* 6주 x 7일 = 42칸 그리드 (남은 공간을 채우며 스크롤 없이 항상 화면에 맞춤) */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1 sm:gap-1.5">
        {days.map((day) => {
          const daySchedules = getSchedulesForDate(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);
          const isSelected = selectedDate
            ? isSameDay(day, selectedDate)
            : false;
          const previewSchedules = daySchedules.slice(0, MAX_PREVIEW_COUNT);
          const overflowCount = daySchedules.length - previewSchedules.length;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              aria-current={isCurrentDay ? "date" : undefined}
              aria-label={`${format(day, "M월 d일", { locale: ko })}, 일정 ${daySchedules.length}개`}
              data-selected={isSelected}
              className={cn(
                "flex h-full min-h-0 flex-col items-start gap-0.5 overflow-hidden rounded-lg p-1 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-1 sm:p-1.5",
                !isCurrentMonth && "text-muted-foreground/50",
                "data-[selected=true]:bg-accent data-[selected=true]:ring-2 data-[selected=true]:ring-primary dark:data-[selected=true]:bg-[#121212]",
              )}
            >
              {/* 날짜 숫자 (오늘은 원형 배지로 강조) */}
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium sm:size-6 sm:text-sm",
                  isCurrentDay && "bg-primary text-primary-foreground",
                  !isCurrentMonth &&
                    !isCurrentDay &&
                    "text-muted-foreground/50",
                )}
              >
                {format(day, "d")}
              </span>

              {/* 일정 미리보기: 모바일은 점, sm 이상은 텍스트 */}
              {daySchedules.length > 0 ? (
                <>
                  {/* 모바일: 점 표시 */}
                  <div
                    className="flex flex-wrap gap-0.5 sm:hidden"
                    aria-hidden="true"
                  >
                    {previewSchedules.map((schedule) => (
                      <span
                        key={schedule.id}
                        className="size-1.5 rounded-full bg-primary"
                      />
                    ))}
                    {overflowCount > 0 && (
                      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>

                  {/* sm 이상: 텍스트 미리보기 */}
                  <div className="hidden w-full min-h-0 flex-col gap-0.5 overflow-hidden sm:flex">
                    {previewSchedules.map((schedule) => (
                      <span
                        key={schedule.id}
                        className="w-full truncate rounded bg-muted px-1 py-0.5 text-[0.65rem] leading-tight text-foreground"
                      >
                        {schedule.title}
                      </span>
                    ))}
                    {overflowCount > 0 && (
                      <span className="text-[0.65rem] leading-tight text-muted-foreground">
                        +{overflowCount}개
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { MonthlyCalendarGrid };
export type { MonthlyCalendarGridProps };
