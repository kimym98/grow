import { describe, expect, it } from "vitest"

import { capitalize, initials, slugify, truncate } from "@/lib/string"

describe("truncate", () => {
  it("문자열이 maxLength 이하면 그대로 반환한다", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("문자열이 maxLength를 초과하면 suffix를 포함해 자른다", () => {
    expect(truncate("hello world", 8)).toBe("hello...")
  })

  it("suffix를 직접 지정할 수 있다", () => {
    expect(truncate("hello world", 7, "…")).toBe("hello …")
  })
})

describe("slugify", () => {
  it("공백을 하이픈으로, 대문자를 소문자로 변환한다", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("특수문자를 제거한다", () => {
    expect(slugify("Hello, World!!")).toBe("hello-world")
  })

  it("연속된 하이픈을 하나로 합친다", () => {
    expect(slugify("a   b---c")).toBe("a-b-c")
  })
})

describe("capitalize", () => {
  it("첫 글자를 대문자로 바꾼다", () => {
    expect(capitalize("hello")).toBe("Hello")
  })

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(capitalize("")).toBe("")
  })
})

describe("initials", () => {
  it("이름의 각 단어 첫 글자를 대문자로 이어붙인다", () => {
    expect(initials("kim min young")).toBe("KM")
  })

  it("count로 사용할 단어 수를 제한한다", () => {
    expect(initials("a b c d", 3)).toBe("ABC")
  })
})
