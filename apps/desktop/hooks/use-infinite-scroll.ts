import { useCallback, useRef } from "react"

interface UseInfiniteScrollOptions {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
}

/**
 * 센티넬 엘리먼트가 뷰포트(또는 지정한 스크롤 컨테이너)에 들어오면 onLoadMore를 호출한다.
 * react-window List처럼 자체 스크롤 컨테이너를 갖는 리스트에서는 마지막 row 자리에
 * sentinelRef를 렌더링해야 IntersectionObserver의 root가 올바르게 잡힌다.
 */
function useInfiniteScroll({ hasMore, isLoading, onLoadMore }: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null

      if (!node || !hasMore || isLoading) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) onLoadMore()
        },
        { rootMargin: "200px" }
      )
      observerRef.current.observe(node)
    },
    [hasMore, isLoading, onLoadMore]
  )

  return { sentinelRef }
}

export { useInfiniteScroll }
