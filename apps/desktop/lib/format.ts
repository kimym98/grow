import { format, formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

export function formatDate(
  date: Date | string,
  pattern: string = "yyyy-MM-dd"
): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, pattern, { locale: ko })
  } catch {
    return ""
  }
}

export function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko })
  } catch {
    return ""
  }
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value)
}

export function formatCurrency(
  amount: number,
  currency: string = "KRW",
  locale: string = "ko-KR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}
