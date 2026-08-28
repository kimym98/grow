import { describe, expect, it } from "vitest"

import { formatCurrency, formatDate, formatNumber } from "@/lib/format"

describe("formatDate", () => {
  it("기본 패턴(yyyy-MM-dd)으로 날짜를 포맷한다", () => {
    expect(formatDate("2026-08-28")).toBe("2026-08-28")
  })

  it("패턴을 직접 지정할 수 있다", () => {
    expect(formatDate("2026-08-28", "yyyy/MM/dd")).toBe("2026/08/28")
  })

  it("유효하지 않은 날짜는 빈 문자열을 반환한다", () => {
    expect(formatDate("not-a-date")).toBe("")
  })
})

describe("formatNumber", () => {
  it("천 단위 구분 기호를 붙여 숫자를 포맷한다", () => {
    expect(formatNumber(1234567)).toBe("1,234,567")
  })
})

describe("formatCurrency", () => {
  it("기본값(KRW)으로 통화를 포맷한다", () => {
    expect(formatCurrency(10000)).toBe("₩10,000")
  })
})
