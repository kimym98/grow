import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

type LoadingStateVariant = "list" | "card" | "detail"

interface LoadingStateProps extends React.ComponentProps<"div"> {
  variant?: LoadingStateVariant
  count?: number
}

function LoadingListItem() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}

function LoadingCardItem() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </CardContent>
    </Card>
  )
}

function LoadingDetail() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <div className="flex flex-col gap-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

function LoadingState({
  variant = "list",
  count = 3,
  className,
  ...props
}: LoadingStateProps) {
  if (variant === "detail") {
    return (
      <div
        data-slot="loading-state"
        className={cn("flex flex-1 flex-col", className)}
        {...props}
      >
        <LoadingDetail />
      </div>
    )
  }

  return (
    <div
      data-slot="loading-state"
      className={cn(
        variant === "card"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
          : "flex flex-col divide-y divide-border",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) =>
        variant === "card" ? (
          <LoadingCardItem key={index} />
        ) : (
          <LoadingListItem key={index} />
        )
      )}
    </div>
  )
}

export { LoadingState }
