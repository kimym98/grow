import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heading, Text } from "@/components/ui/typography"

export function HeroSection() {
  return (
    <section className="py-24 md:py-36 lg:py-48">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center text-center gap-8">
          <Badge variant="secondary">새 버전 출시</Badge>

          <Heading as="h1" size="h1">
            모던 웹 개발의 새로운 기준
          </Heading>

          <Text variant="lead" className="max-w-2xl">
            Next.js 16, React 19, Tailwind CSS v4를 활용한 빠르고 확장 가능한 웹
            스타터 킷. 디자인 시스템부터 고급 기능까지 모든 것이 준비되어
            있습니다.
          </Text>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button size="lg" asChild>
              <Link href="#features">
                시작하기
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com" target="_blank">
                GitHub에서 보기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
