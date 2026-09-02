import { useEffect, useState } from "react"

/** value가 delay(ms)만큼 변화 없이 유지될 때만 갱신되는 디바운스된 값을 반환한다 */
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export { useDebouncedValue }
