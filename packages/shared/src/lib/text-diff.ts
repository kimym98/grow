/**
 * originalText/reviewedText 원문 두 개로부터 UI 렌더링용 diff 세그먼트를 계산한다.
 * document_reviews는 diffSegments를 저장하지 않고 원문만 저장하므로(스키마 주석 참고),
 * 화면에 보여줄 때 클라이언트에서 이 함수로 즉석 계산한다.
 *
 * 공백 단위 토큰의 LCS(최장 공통 부분열) 기반 diff — O(n*m)이라 매우 긴 문서에서는
 * 느려질 수 있지만, 이력서/포트폴리오 첨삭 텍스트 규모(수백~수천 토큰)에서는 충분하다.
 */
export interface DocumentDiffSegment {
  type: "unchanged" | "added" | "removed"
  text: string
}

function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? []
}

export function computeDiffSegments(original: string, reviewed: string): DocumentDiffSegment[] {
  const a = tokenize(original)
  const b = tokenize(reviewed)
  const n = a.length
  const m = b.length

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const segments: DocumentDiffSegment[] = []

  function push(type: DocumentDiffSegment["type"], text: string) {
    const last = segments[segments.length - 1]
    if (last && last.type === type) {
      last.text += text
    } else {
      segments.push({ type, text })
    }
  }

  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("unchanged", a[i])
      i += 1
      j += 1
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push("removed", a[i])
      i += 1
    } else {
      push("added", b[j])
      j += 1
    }
  }
  while (i < n) {
    push("removed", a[i])
    i += 1
  }
  while (j < m) {
    push("added", b[j])
    j += 1
  }

  return segments
}
