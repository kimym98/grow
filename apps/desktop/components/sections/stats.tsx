import { Heading, Text } from "@/components/ui/typography"
import { formatNumber } from "@/lib/format"
import type { StatItem } from "@/types"

const STATS: StatItem[] = [
  {
    value: "99.9",
    label: "가동률",
    description: "99.9% 이상의 안정적인 성능",
  },
  {
    value: "15",
    label: "KB",
    description: "초경량 번들 크기",
  },
  {
    value: "0",
    label: "기본 의존성",
    description: "제로 의존성으로 깔끔한 프로젝트 구조",
  },
  {
    value: "100",
    label: "Lighthouse 점수",
    description: "완벽한 성능과 접근성",
  },
]

export function StatsSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <Heading as="h3" size="h3" className="text-primary">
                {stat.value}
                {stat.label === "%" ? "%" : stat.label}
              </Heading>
              <Text variant="default" className="font-semibold mt-2">
                {stat.label === "%" ? "가동률" : stat.description}
              </Text>
              {stat.description && stat.label !== "%" && (
                <Text variant="muted" className="text-xs mt-1">
                  {stat.description}
                </Text>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
