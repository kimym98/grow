import { describe, expect, it } from "vitest"

import { normalizeCompanyName } from "./normalize-company-name"

describe("normalizeCompanyName", () => {
  it("괄호로 감싼 (주) 표기를 제거한다", () => {
    expect(normalizeCompanyName("(주)그로우")).toBe("그로우")
  })

  it("전각 괄호와 ㈜ 기호를 제거한다", () => {
    expect(normalizeCompanyName("㈜ 그로우")).toBe("그로우")
  })

  it("접미사 '주식회사'를 제거한다", () => {
    expect(normalizeCompanyName("그로우 주식회사")).toBe("그로우")
  })

  it("공백 없이 붙은 '주식회사'도 제거한다", () => {
    expect(normalizeCompanyName("그로우주식회사")).toBe("그로우")
  })

  it("영문 법인격 접미사와 대소문자를 정규화한다", () => {
    expect(normalizeCompanyName("Grow Inc.")).toBe("grow")
  })

  it("연속 공백을 단일 공백으로 축약하고 trim한다", () => {
    expect(normalizeCompanyName("  그로우   테크  ")).toBe("그로우 테크")
  })
})
