/**
 * 기업명 정규화 순수 함수
 * company_key 계산에 사용하며, Task 046(기업 LLM 분석)에서도 동일 로직으로 재사용한다.
 * 사이드이펙트가 없어야 하므로 packages/shared에 순수 함수로 둔다.
 */

// 법인격 표기를 제거하기 위한 토큰들 ("(주)"처럼 괄호를 포함한 형태도 통째로 처리)
const CORP_TOKENS = ["(주)", "（주）", "주식회사", "㈜"]

export function normalizeCompanyName(name: string): string {
  let result = name

  // 법인격 토큰 제거 (접두/접미 모두)
  for (const token of CORP_TOKENS) {
    result = result.split(token).join(" ")
  }

  // 남은 괄호 제거 (전각/반각)
  result = result.replace(/[()（）]/g, " ")

  // 영문 법인격 접미사 제거 (Inc, Co, Ltd, Corp 등)
  result = result.replace(/\b(inc|co|ltd|corp|company)\.?\b/gi, " ")

  // 잔여 구두점(.) 제거, 연속 공백 축약 후 trim, 소문자화
  result = result.replace(/\./g, " ").replace(/\s+/g, " ").trim().toLowerCase()

  return result
}
