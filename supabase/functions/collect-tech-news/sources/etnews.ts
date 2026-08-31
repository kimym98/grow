import { delay, fetchWithBackoff } from "../../_shared/fetch-with-policy.ts"
import type { NewsSource, NormalizedNewsItem } from "../types.ts"

/**
 * 전자신문(etnews) RSS 어댑터
 * 문서: docs/news-source-research.md 2절 참고
 *
 * 최초 웹 검색으로 얻은 Section041/045.xml 경로는 실제로는 WAF에 의해
 * 차단되는 구식 경로임을 curl 실측으로 확인했다. www.etnews.com/rss/
 * 페이지를 직접 파싱해 확정한 현재 유효한 코드: AI(04046), 보안(04045).
 *
 * robots.txt는 전면 Allow이며 AI 크롤러 차단 규칙도 주석 처리되어
 * 비활성 상태라 별도 User-Agent 제약은 없다.
 */
const FEED_URLS = [
  "https://rss.etnews.com/04046.xml", // AI
  "https://rss.etnews.com/04045.xml", // 보안
]
const USER_AGENT = "grow-news-collector/1.0 (non-commercial personal project)"

/** 같은 사이트(etnews)로 나가는 두 피드 요청 사이 최소 간격(ms). 동시 요청으로 인한 트래픽 집중을 피한다 */
const INTER_FEED_DELAY_MS = 1500

function extractCdata(value: string): string {
  const match = value.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return match ? match[1] : value
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

/** RFC 822 형식(예: "Thu, 27 Aug 2026 15:03:05 +0900")을 ISO 날짜(YYYY-MM-DD)로 변환한다 */
function parsePubDate(rawText: string): string | null {
  const date = new Date(rawText.trim())
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function normalizeItem(block: string): NormalizedNewsItem | null {
  const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/)
  const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/)
  const descriptionMatch = block.match(/<description>([\s\S]*?)<\/description>/)
  const pubDateMatch = block.match(/<pubDate>([^<]*)<\/pubDate>/)

  if (!titleMatch || !linkMatch || !pubDateMatch) return null

  const publishedAt = parsePubDate(pubDateMatch[1])
  if (!publishedAt) return null

  return {
    title: stripTags(extractCdata(titleMatch[1])),
    summary: descriptionMatch ? stripTags(extractCdata(descriptionMatch[1])) : "",
    source: "etnews",
    publishedAt,
    url: stripTags(linkMatch[1]),
  }
}

async function fetchFeed(url: string): Promise<NormalizedNewsItem[]> {
  const response = await fetchWithBackoff(url, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!response.ok) {
    throw new Error(`전자신문 RSS 요청 실패(${url}): ${response.status} ${response.statusText}`)
  }
  const xml = await response.text()

  const blocks = xml.split("<item>").slice(1)
  const items = blocks
    .map(normalizeItem)
    .filter((item): item is NormalizedNewsItem => item !== null)

  console.log("[etnews] feed:", url, "parsed items:", items.length, "/ blocks:", blocks.length)
  return items
}

/**
 * AI/보안 두 섹션 피드에 동일 기사가 중복 게재되는 경우가 있어(url 동일),
 * 같은 배치 내 url 중복은 upsert(ON CONFLICT DO UPDATE)가 처리하지 못하므로
 * 여기서 먼저 url 기준으로 제거한다.
 */
function dedupeByUrl(items: NormalizedNewsItem[]): NormalizedNewsItem[] {
  const seen = new Map<string, NormalizedNewsItem>()
  for (const item of items) {
    seen.set(item.url, item)
  }
  return Array.from(seen.values())
}

/**
 * 같은 사이트로 나가는 요청이 겹치지 않도록 피드를 순차적으로 요청하고,
 * 마지막 피드가 아니면 다음 요청 전에 최소 간격을 둔다.
 */
async function fetchAll(): Promise<NormalizedNewsItem[]> {
  const results: NormalizedNewsItem[][] = []
  for (const [index, url] of FEED_URLS.entries()) {
    results.push(await fetchFeed(url))
    if (index < FEED_URLS.length - 1) await delay(INTER_FEED_DELAY_MS)
  }
  return dedupeByUrl(results.flat())
}

export const etnewsSource: NewsSource = {
  name: "etnews",
  fetchAll,
}
