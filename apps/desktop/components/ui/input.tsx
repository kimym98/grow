import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, onClick, onBlur, ...props }: React.ComponentProps<"input">) {
  // type="time"/"date"는 크로미움에서 시계/달력 아이콘을 눌러야만 드롭다운이 열리므로,
  // 입력 영역 전체를 클릭해도 열리도록 showPicker()를 함께 호출한다.
  // 픽커가 열려 있는 상태에서 다시 클릭하면 blur()로 닫아 토글처럼 동작하게 한다.
  const isPickerType = type === "time" || type === "date"
  const isPickerOpenRef = React.useRef(false)

  function handleClick(event: React.MouseEvent<HTMLInputElement>) {
    onClick?.(event)
    if (!isPickerType) return

    if (isPickerOpenRef.current) {
      event.currentTarget.blur()
      isPickerOpenRef.current = false
    } else {
      event.currentTarget.showPicker?.()
      isPickerOpenRef.current = true
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    isPickerOpenRef.current = false
    onBlur?.(event)
  }

  return (
    <input
      type={type}
      data-slot="input"
      onClick={isPickerType ? handleClick : onClick}
      onBlur={isPickerType ? handleBlur : onBlur}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
