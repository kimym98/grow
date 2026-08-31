import { fetchWithBackoff } from "../../_shared/fetch-with-policy.ts"
import type { JobPostingSource, NormalizedJobPosting } from "../types.ts"

/**
 * 잡코리아(JobKorea) 채용 목록 크롤링 어댑터
 * 문서: docs/job-source-research.md 1절 참고
 *
 * robots.txt(robots/jobkorea.txt)가 AI 크롤러에게도 명시적으로 Allow한
 * /recruit/joblist(목록) 경로만 사용한다.
 *
 * 페이지네이션 관련 주의: 목록 페이지 URL에 ?Page=N 쿼리를 붙여도 응답 내용이
 * 동일한 1페이지로 고정됨을 실측 확인했다(세션/쿠키 기반 상태이거나 별도 AJAX
 * 엔드포인트가 필요한 것으로 추정). 안정적인 페이지네이션 방식을 찾지 못해
 * 이번 구현은 최초 목록 페이지(1회 요청) 수집만 지원한다.
 *
 * 직무 필터: ?duty=코드1,코드2 쿼리는 실측 결과 실제로 결과가 바뀜을 확인했다
 * (Page와 달리 세션 없이도 동작). 목록 페이지의 직무 선택 체크박스
 * (data-value-json)에서 추출한 코드: 프론트엔드개발자=1000230,
 * AI/ML엔지니어=1000242, AI/ML연구원=1000417. 사용자 요청(프론트엔드·AI 직무)에
 * 따라 이 세 코드로 고정한다. 다른 직무로 바꾸려면 아래 DUTY_CODES만 수정하면 된다.
 */
const DUTY_CODES = ["1000230", "1000242", "1000417"]
const LIST_URL = `https://www.jobkorea.co.kr/recruit/joblist?duty=${DUTY_CODES.join(",")}`
const BASE_URL = "https://www.jobkorea.co.kr"
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
 * 잡코리아 마감일 텍스트를 ISO 날짜 문자열(YYYY-MM-DD)로 변환한다.
 * "상시채용"은 null, "~MM/DD (요일)"은 올해(이미 지난 날짜면 내년) 날짜로,
 * "D-N"은 오늘 기준 N일 뒤 날짜로 계산한다. 그 외 패턴은 null로 처리한다.
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

  const dDay = text.match(/D-(\d+)/)
  if (dDay) {
    const days = Number(dDay[1])
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return target.toISOString().slice(0, 10)
  }

  return null
}

function normalizeBlock(block: string): NormalizedJobPosting | null {
  const titleMatch = block.match(
    /<a href="\/Recruit\/GI_Read\/(\d+)\?[^"]*" class="link normalLog" title="([^"]*)"/,
  )
  const companyMatch = block.match(
    /<a href="\/Recruit\/Co_Read\/C\/\d+" class="link normalLog"[^>]*>([^<]*)<\/a>/,
  )
  if (!titleMatch || !companyMatch) return null

  const [, id, title] = titleMatch
  const company = stripTags(companyMatch[1])

  const etcMatch = block.match(/<p class="etc">([\s\S]*?)<\/p>/)
  const cells = etcMatch
    ? Array.from(etcMatch[1].matchAll(/<span class="cell">([\s\S]*?)<\/span>/g)).map((m) => stripTags(m[1]))
    : []
  const [careerLevel = "", , location = "", employmentType = ""] = cells

  const deadlineMatch = block.match(/<span class="date dotum">([\s\S]*?)<\/td>/)
  const deadline = deadlineMatch ? parseDeadline(deadlineMatch[1]) : null

  const sourceUrl = `${BASE_URL}/Recruit/GI_Read/${id}?rPageCode=SL`

  return {
    title: stripTags(title),
    company,
    location,
    careerLevel,
    deadline,
    tags: employmentType ? [employmentType] : [],
    url: sourceUrl,
    sourceUrl,
    source: "jobkorea",
  }
}

async function fetchAll(): Promise<NormalizedJobPosting[]> {
  const response = await fetchWithBackoff(LIST_URL, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!response.ok) {
    throw new Error(`잡코리아 목록 페이지 요청 실패: ${response.status} ${response.statusText}`)
  }
  const html = await response.text()
  console.log("[jobkorea] response length:", html.length)

  const blocks = html.split('<tr class="devloopArea"').slice(1)
  const items = blocks
    .map(normalizeBlock)
    .filter((item): item is NormalizedJobPosting => item !== null)

  console.log("[jobkorea] parsed items:", items.length, "/ blocks:", blocks.length)
  return items
}

export const jobkoreaSource: JobPostingSource = {
  name: "jobkorea",
  fetchAll,
}
