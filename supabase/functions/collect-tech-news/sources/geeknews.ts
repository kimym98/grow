import { fetchWithBackoff } from "../../_shared/fetch-with-policy.ts"
import type { NewsSource, NormalizedNewsItem } from "../types.ts"

/**
 * GeekNews(news.hada.io) Atom RSS 어댑터
 * 문서: docs/news-source-research.md 1절 참고
 *
 * robots.txt 확인 결과 ClaudeBot/anthropic-ai 등 "모델 학습·대량 수집" 크롤러
 * 그룹은 전면 Disallow 되어 있으나, User-agent: * 그룹은 /rss/news를 포함해
 * 허용한다. 따라서 AI 크롤러로 식별되지 않는 중립 User-Agent를 사용한다
 * (Content-Signal 헤더도 ai-input=yes로 이 용도의 사용을 허용함).
 */
const FEED_URL = "https://news.hada.io/rss/news"
const USER_AGENT = "grow-news-collector/1.0 (non-commercial personal project)"
const SUMMARY_MAX_LENGTH = 300

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

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}

function normalizeEntry(block: string): NormalizedNewsItem | null {
  const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/)
  const linkMatch = block.match(/<link rel='alternate'[^>]*href='([^']*)'/)
  const contentMatch = block.match(/<content[^>]*>([\s\S]*?)<\/content>/)
  const publishedMatch = block.match(/<published>([^<]*)<\/published>/)

  if (!titleMatch || !linkMatch || !publishedMatch) return null

  const title = stripTags(extractCdata(titleMatch[1]))
  const url = linkMatch[1]
  const summary = contentMatch ? truncate(stripTags(extractCdata(contentMatch[1])), SUMMARY_MAX_LENGTH) : ""
  const publishedAt = publishedMatch[1].slice(0, 10)

  return {
    title,
    summary,
    source: "geeknews",
    publishedAt,
    url,
  }
}

async function fetchAll(): Promise<NormalizedNewsItem[]> {
  const response = await fetchWithBackoff(FEED_URL, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!response.ok) {
    throw new Error(`GeekNews RSS 요청 실패: ${response.status} ${response.statusText}`)
  }
  const xml = await response.text()

  const blocks = xml.split("<entry>").slice(1)
  const items = blocks
    .map(normalizeEntry)
    .filter((item): item is NormalizedNewsItem => item !== null)

  console.log("[geeknews] parsed items:", items.length, "/ blocks:", blocks.length)
  return items
}

export const geeknewsSource: NewsSource = {
  name: "geeknews",
  fetchAll,
}
