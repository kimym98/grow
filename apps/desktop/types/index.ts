export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  external?: boolean
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

export interface ElectronApi {
  ping: () => string
  onAuthCallback: (callback: (url: string) => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronApi
  }
}
