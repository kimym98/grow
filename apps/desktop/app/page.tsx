import { TodayNewsCarousel } from "@/components/sections/dashboard/today-news-carousel"
import { DashboardCalendarSection } from "@/components/sections/dashboard/dashboard-calendar-section"

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <section aria-labelledby="today-news-heading" className="shrink-0">
        <h2 id="today-news-heading" className="text-lg font-semibold">
          오늘의 뉴스
        </h2>
        <TodayNewsCarousel />
      </section>

      {/* 창 높이가 아주 작아져도 캘린더가 완전히 찌그러지지 않도록 최소 높이를 보장 (부족하면 상위 main에서 전체 스크롤 처리) */}
      <section
        aria-labelledby="dashboard-calendar-heading"
        className="flex min-h-[480px] flex-1 flex-col"
      >
        <DashboardCalendarSection headingId="dashboard-calendar-heading" />
      </section>
    </div>
  )
}
