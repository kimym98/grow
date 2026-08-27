import { TodayNewsCarousel } from "@/components/sections/dashboard/today-news-carousel"
import { DashboardCalendarSection } from "@/components/sections/dashboard/dashboard-calendar-section"

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6">
      <section aria-labelledby="today-news-heading" className="shrink-0">
        <h2 id="today-news-heading" className="text-lg font-semibold">
          오늘의 뉴스
        </h2>
        <TodayNewsCarousel />
      </section>

      <section
        aria-labelledby="dashboard-calendar-heading"
        className="flex min-h-0 flex-1 flex-col"
      >
        <DashboardCalendarSection headingId="dashboard-calendar-heading" />
      </section>
    </div>
  )
}
