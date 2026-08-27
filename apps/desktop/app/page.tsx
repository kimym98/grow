import { TodayNewsCarousel } from "@/components/sections/dashboard/today-news-carousel"
import { DashboardCalendarSection } from "@/components/sections/dashboard/dashboard-calendar-section"
import { NotificationSettings } from "@/components/sections/calendar/notification-settings"

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6">
      <section aria-labelledby="today-news-heading" className="shrink-0">
        <h2 id="today-news-heading" className="text-lg font-semibold">
          오늘의 뉴스
        </h2>
        <TodayNewsCarousel />
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <div
          aria-labelledby="dashboard-calendar-heading"
          className="flex min-h-0 flex-col"
        >
          <h2 id="dashboard-calendar-heading" className="shrink-0 text-lg font-semibold">
            일정
          </h2>
          <DashboardCalendarSection />
        </div>

        <div className="shrink-0">
          <NotificationSettings />
        </div>
      </section>
    </div>
  )
}
