import {
  Zap,
  Shield,
  Palette,
  Globe,
  Code2,
  Layers,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heading, Text } from "@/components/ui/typography"
import type { FeatureItem } from "@/types"

const FEATURES: FeatureItem[] = [
  {
    icon: Zap,
    title: "초고속 성능",
    description:
      "Next.js 16과 React 19의 최신 최적화 기능으로 극한의 성능을 제공합니다.",
  },
  {
    icon: Shield,
    title: "TypeScript",
    description:
      "엄격한 타입 검사로 런타임 오류를 사전에 방지합니다.",
  },
  {
    icon: Palette,
    title: "Tailwind CSS v4",
    description:
      "최신 Tailwind 버전으로 강력한 CSS 변수와 동적 색상 시스템을 활용합니다.",
  },
  {
    icon: Globe,
    title: "shadcn/ui 컴포넌트",
    description:
      "접근성과 디자인이 최적화된 무료 UI 컴포넌트 라이브러리입니다.",
  },
  {
    icon: Code2,
    title: "개발자 경험",
    description:
      "직관적인 API와 풍부한 유틸리티로 개발 생산성을 극대화합니다.",
  },
  {
    icon: Layers,
    title: "확장 가능한 구조",
    description:
      "계층화된 아키텍처로 프로젝트 규모에 따라 자유롭게 확장할 수 있습니다.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center text-center gap-8 mb-16">
          <Heading as="h2" size="h2">
            강력한 기능들
          </Heading>
          <Text variant="lead" className="max-w-2xl">
            모던 웹 개발에 필요한 모든 기능이 사전에 구성되어 있습니다.
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Icon className="size-8 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Text variant="muted">{feature.description}</Text>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
