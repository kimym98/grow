import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ErrorStateProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
  onRetry?: () => void
}

function ErrorState({
  title = "문제가 발생했습니다",
  description = "잠시 후 다시 시도해 주세요.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center sm:p-10",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  )
}

export { ErrorState }
