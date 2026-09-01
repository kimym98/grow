import { fetchWithBackoff } from "../../_shared/fetch-with-policy.ts"
import type { JobPostingSource, NormalizedJobPosting } from "../types.ts"

/**
 * 커리어(career.co.kr) 채용 목록 크롤링 어댑터
 * 문서: docs/research/job-source-research.md 커리어 절 참고
 *
 * 실제 채용정보는 www.career.co.kr이 아니라 서브도메인 job.career.co.kr에서
 * 서빙된다(실측 확인, 2026-09-01). robots.txt(robots/career.txt)가 /admin,
 * /app, /base, /biz, /user, /signup만 차단하므로 목록 경로(/jobs/jobpart)는
 * 허용 범위다.
 *
 * 목록 페이지는 ASP 서버에서 완성된 HTML로 내려오는 SSR이라 curl(fetch)만으로
 * 파싱 가능함을 실측 확인했다. i_page=2 쿼리를 붙여도 응답 id 목록이 완전히
 * 동일해(diff 없음) 잡코리아와 동일하게 이번 구현은 최초 목록 페이지(1회 요청)
 * 수집만 지원한다.
 *
 * 목록 HTML에는 title/company/deadline/url만 존재하고 location/careerLevel
 * 필드는 아예 없다(잡코리아 목록과의 차이점). 상세페이지를 추가 요청하면 얻을 수
 * 있으나 잡코리아 어댑터도 목록 1회 요청만으로 구현되어 있어 무게를 맞추기 위해
 * 이번 Task 범위에서는 상세페이지 요청을 하지 않고 빈 문자열로 채운다.
 *
 * 직무 필터: i_jc1=H0(IT.인터넷)만 실측으로 결과가 바뀜을 확인했다. 잡코리아처럼
 * 프론트엔드/AI만 골라내는 세부 duty 코드는 목록 페이지에서 찾지 못해 이번에는
 * IT.인터넷 대분류 하나로 제한한다(잡코리아 대비 필터 정밀도가 낮은 한계).
 */
const LIST_URL = "https://job.career.co.kr/jobs/jobpart?i_jc1=H0"
const USER_AGENT = "grow-job-collector/1.0 (non-commercial personal project)"

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#183;/g, "·")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * 커리어 마감일 텍스트를 ISO 날짜 문자열(YYYY-MM-DD)로 변환한다.
 * 목록 페이지에서는 "상시채용"과 "~MM/DD" 두 형식만 실측 확인됨(D-N 형식은
 * .tr .tx 영역에서만 중복 표기되고 .detDt에는 나타나지 않아 미지원).
 */
function parseDeadline(rawText: string): string | null {
  const text = stripTags(rawText)

  if (text.includes("상시채용")) return null

  const mmdd = text.match(/(\d{2})\/(\d{2})/)
  if (mmdd) {
    const [, month, day] = mmdd
    const now = new Date()
    let year = now.getFullYear()
    const candidate = new Date(`${year}-${month}-${day}`)
    if (candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
      year += 1
    }
    return `${year}-${month}-${day}`
  }

  return null
}

function normalizeBlock(block: string): NormalizedJobPosting | null {
  const idMatch = block.match(/recruit\/view\/(\d+)/)
  const titleMatch = block.match(/<div class="tit">([\s\S]*?)<\/div>/)
  const companyMatch = block.match(/<span class="lbc">([\s\S]*?)<\/span>/)
  if (!idMatch || !titleMatch || !companyMatch) return null

  const [, id] = idMatch
  const title = stripTags(titleMatch[1])
  const company = stripTags(companyMatch[1])

  const deadlineMatch = block.match(/<span class="detDt">([\s\S]*?)<\/span>/)
  const deadline = deadlineMatch ? parseDeadline(deadlineMatch[1]) : null

  const sourceUrl = `https://job.career.co.kr/recruit/view/${id}`

  return {
    title,
    company,
    // 목록 페이지 HTML에 location/careerLevel 필드가 존재하지 않아 빈 문자열로 채운다
    location: "",
    careerLevel: "",
    deadline,
    tags: [],
    url: sourceUrl,
    sourceUrl,
    source: "career",
  }
}

async function fetchAll(): Promise<NormalizedJobPosting[]> {
  const response = await fetchWithBackoff(LIST_URL, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!response.ok) {
    throw new Error(`커리어 목록 페이지 요청 실패: ${response.status} ${response.statusText}`)
  }
  const html = await response.text()
  console.log("[career] response length:", html.length)

  const blocks = html.split('<div class="recBoxArea').slice(1)
  const parsed = blocks
    .map(normalizeBlock)
    .filter((item): item is NormalizedJobPosting => item !== null)

  // 프리미엄 위젯과 직무별 목록에 같은 공고가 중복 노출되는 경우가 실측으로 확인되어
  // sourceUrl(upsert 고유키) 기준으로 중복 제거한다(중복 시 DB upsert가 실패함)
  const items = Array.from(new Map(parsed.map((item) => [item.sourceUrl, item])).values())

  console.log("[career] parsed items:", items.length, "/ blocks:", blocks.length)
  return items
}

export const careerSource: JobPostingSource = {
  name: "career",
  fetchAll,
}
