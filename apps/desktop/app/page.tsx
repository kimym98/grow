import { HeroSection } from "@/components/sections/hero"
import { FeaturesSection } from "@/components/sections/features"
import { StatsSection } from "@/components/sections/stats"
import { CtaSection } from "@/components/sections/cta"
import { FaqSection } from "@/components/sections/faq"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CtaSection />
      <FaqSection />
    </>
  )
}
