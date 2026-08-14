import type { NavItem, SiteConfig } from "@/types"

export const SITE_CONFIG: SiteConfig = {
  name: "Next.js Starter Kit",
  description: "모던 웹 개발을 위한 Next.js 16 스타터 킷",
  url: "https://example.com",
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "기능",
    href: "#features",
  },
  {
    label: "FAQ",
    href: "#faq",
  },
  {
    label: "GitHub",
    href: "https://github.com",
    external: true,
  },
]

export const FOOTER_LINKS = {
  product: [
    { label: "기능", href: "#features" },
    { label: "문서", href: "/docs" },
  ],
  company: [
    { label: "소개", href: "/about" },
    { label: "블로그", href: "/blog" },
    { label: "연락처", href: "/contact" },
  ],
}
