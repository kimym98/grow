/**
 * 기업명 정규화 순수 함수 (Deno 네이티브 로컬 복제본)
 * packages/shared/src/lib/normalize-company-name.ts와 동일 로직을 유지한다.
 * Edge Function 런타임(Deno)에는 @app/shared import map이 등록되어 있지 않아
 * 번들 분리를 위해 이 파일에 최소 버전을 복제해 둔다 — 로직을 바꿀 때는 두 파일을 함께 검토할 것.
 */

const CORP_TOKENS = ["(주)", "（주）", "주식회사", "㈜"]

export function normalizeCompanyName(name: string): string {
  let result = name

  for (const token of CORP_TOKENS) {
    result = result.split(token).join(" ")
  }

  result = result.replace(/[()（）]/g, " ")
  result = result.replace(/\b(inc|co|ltd|corp|company)\.?\b/gi, " ")
  result = result.replace(/\./g, " ").replace(/\s+/g, " ").trim().toLowerCase()

  return result
}
