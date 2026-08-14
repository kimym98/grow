export interface NavItem {
  label: string
  href: string
  external?: boolean
}

export interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

export interface StatItem {
  value: string
  label: string
  description?: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export type SortOrder = "asc" | "desc"

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface SiteConfig {
  name: string
  description: string
  url: string
}
