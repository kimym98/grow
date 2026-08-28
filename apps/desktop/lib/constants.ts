import {
  Briefcase,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Newspaper,
  Settings,
} from "lucide-react"
import type { NavItem, SiteConfig } from "@/types"

export const SITE_CONFIG: SiteConfig = {
  name: "Grow",
  description: "IT 취업 준비생을 위한 공고 탐색·서류 첨삭·면접 준비·일정 관리 올인원 워크스페이스",
  url: "https://example.com",
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "대시보드",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "공고",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    label: "뉴스",
    href: "/news",
    icon: Newspaper,
  },
  {
    label: "문서",
    href: "/documents",
    icon: FileText,
  },
  {
    label: "퀴즈",
    href: "/quiz",
    icon: HelpCircle,
  },
  {
    label: "설정",
    href: "/settings",
    icon: Settings,
  },
]
