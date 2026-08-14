import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heading, Text } from "@/components/ui/typography"

export function CtaSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <Separator className="mb-12" />

        <div className="flex flex-col items-center text-center gap-6">
          <Heading as="h2" size="h2">
            지금 시작하세요
          </Heading>

          <Text variant="lead" className="max-w-2xl">
            Next.js 스타터 킷으로 빠르게 프로젝트를 시작하고, 강력한 기능들을 활용해보세요.
          </Text>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button size="lg" asChild>
              <Link href="https://github.com" target="_blank">
                GitHub에서 Clone하기
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">문서 읽기</Link>
            </Button>
          </div>
        </div>

        <Separator className="mt-12" />
      </div>
    </section>
  )
}
