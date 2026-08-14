import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Heading, Text } from "@/components/ui/typography"
import type { FaqItem } from "@/types"

const FAQS: FaqItem[] = [
  {
    question: "Next.js 16과 React 19는 프로덕션에서 사용할 수 있나요?",
    answer:
      "네, 완전히 프로덕션 준비가 된 안정적인 버전입니다. 전 세계 많은 기업에서 사용 중입니다.",
  },
  {
    question: "TypeScript 초보자도 사용할 수 있나요?",
    answer:
      "물론입니다. 상세한 타입 정의와 명확한 컴포넌트 구조로 학습 곡선이 완만합니다.",
  },
  {
    question: "이 스타터 킷으로 어떤 프로젝트를 만들 수 있나요?",
    answer:
      "블로그, SaaS 앱, 전자상거래 사이트, 관리자 대시보드 등 거의 모든 종류의 웹 프로젝트를 만들 수 있습니다.",
  },
  {
    question: "라이선스는 어떻게 되나요?",
    answer:
      "MIT 라이선스로 개인 프로젝트, 상업 프로젝트 모두 자유롭게 사용할 수 있습니다.",
  },
  {
    question: "업데이트는 어떻게 제공되나요?",
    answer:
      "GitHub의 main 브랜치에서 정기적으로 업데이트됩니다. 새로운 기능과 개선사항이 추가됩니다.",
  },
  {
    question: "지원이나 커뮤니티가 있나요?",
    answer:
      "GitHub Discussions에서 질문할 수 있고, 풍부한 문서와 예제가 제공됩니다.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center text-center gap-8 mb-16">
          <Heading as="h2" size="h2">
            자주 묻는 질문
          </Heading>
          <Text variant="lead" className="max-w-2xl">
            스타터 킷에 대한 궁금증을 해결해보세요.
          </Text>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
