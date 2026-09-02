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
import { ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";
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
  /** 셀 좌상단 "+" 버튼 클릭 시 호출 (미지정 시 onSelectDate로 대체) */
  onAddSchedule?: (date: Date) => void;
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
  onAddSchedule,
  className,
}: MonthlyCalendarGridProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  // 달마다 주 수가 다르므로(4~6주) 고정 6행 대신 실제 주 수만큼만 행을 생성해 빈 줄이 남지 않도록 함
  const weekCount = days.length / 7;

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

      {/* 요일 헤더: 창이 작아져도 잘리지 않도록 기본 폰트를 더 작게 설정 */}
      <div className="grid shrink-0 grid-cols-7 gap-px px-1 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} aria-hidden="true">
            {label}
          </div>
        ))}
      </div>

      {/* 6주 x 7일 = 42칸 그리드. 셀 사이는 얇은 구분선(gap-px + bg)으로 표현하는 노션 스타일 */}
      {/* 창이 작아져도 셀이 최소 크기(72px 높이 / 70px 너비) 밑으로 짜부라들지 않도록 하고,
          그보다 창이 작아지면 이 래퍼에 가로/세로 스크롤이 생겨 잘림 없이 전체를 볼 수 있게 함 */}
      <div className="min-h-0 flex-1 overflow-auto rounded-lg ring-1 ring-border/60">
        <div
          className="grid h-full min-h-[320px] min-w-[490px] grid-cols-7 gap-px bg-border/60"
          style={{ gridTemplateRows: `repeat(${weekCount}, minmax(72px, 1fr))` }}
        >
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
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(day)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDate(day);
                }
              }}
              aria-current={isCurrentDay ? "date" : undefined}
              aria-label={`${format(day, "M월 d일", { locale: ko })}, 일정 ${daySchedules.length}개`}
              data-selected={isSelected}
              className={cn(
                "group/cell relative flex h-full min-h-0 flex-col gap-0.5 overflow-hidden bg-card p-1 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-1 sm:p-1.5",
                !isCurrentMonth && "bg-card/40 text-muted-foreground/50",
                "data-[selected=true]:bg-accent dark:data-[selected=true]:bg-[#121212]",
              )}
            >
              {/* 날짜 숫자 + hover 시 노출되는 "+" 추가 버튼: 셀 좌상단에 나란히 배치 */}
              <div className="flex shrink-0 items-center justify-between gap-1">
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

                <button
                  type="button"
                  aria-label={`${format(day, "M월 d일", { locale: ko })} 일정 추가`}
                  onClick={(event) => {
                    event.stopPropagation();
                    (onAddSchedule ?? onSelectDate)(day);
                  }}
                  className="flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/cell:opacity-100 sm:size-6"
                >
                  <Plus className="size-3.5 text-muted-foreground sm:size-4" />
                </button>
              </div>

              {/* 일정 미리보기: 셀 폭이 좁아지는 구간(md 미만)은 점, md 이상은 아이콘+텍스트 pill */}
              {daySchedules.length > 0 ? (
                <>
                  {/* 좁은 셀: 포인트 컬러 점 인디케이터 */}
                  <div
                    className="flex flex-wrap gap-0.5 md:hidden"
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

                  {/* 넓은 셀: 문서 아이콘 + 텍스트가 있는 어두운 pill, 세로로 쌓임 */}
                  <div className="hidden w-full min-h-0 flex-col gap-0.5 overflow-hidden md:flex">
                    {previewSchedules.map((schedule) => (
                      <span
                        key={schedule.id}
                        className="flex w-full items-center gap-1 truncate rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] leading-tight text-foreground"
                      >
                        <FileText className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{schedule.title}</span>
                      </span>
                    ))}
                    {overflowCount > 0 && (
                      <span className="px-1.5 text-[0.65rem] leading-tight text-muted-foreground">
                        +{overflowCount}개
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export { MonthlyCalendarGrid };
export type { MonthlyCalendarGridProps };
