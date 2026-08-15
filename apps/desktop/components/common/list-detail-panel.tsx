"use client"

import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ListDetailPanelProps extends React.ComponentProps<"div"> {
  list: React.ReactNode
  detail: React.ReactNode
  showDetail: boolean
  onBack?: () => void
}

function ListDetailPanel({
  list,
  detail,
  showDetail,
  onBack,
  className,
  ...props
}: ListDetailPanelProps) {
  return (
    <div
      data-slot="list-detail-panel"
      className={cn(
        "flex h-full min-h-0 flex-1 md:grid md:grid-cols-[minmax(280px,360px)_1fr]",
        className
      )}
      {...props}
    >
      <div
        data-slot="list-detail-panel-list"
        className={cn(
          "h-full min-h-0 overflow-y-auto border-border/40 md:block md:border-r",
          showDetail ? "hidden" : "block"
        )}
      >
        {list}
      </div>

      <div
        data-slot="list-detail-panel-detail"
        className={cn(
          "h-full min-h-0 overflow-y-auto md:block",
          showDetail ? "block" : "hidden"
        )}
      >
        {onBack ? (
          <div className="flex h-12 items-center border-b border-border/40 px-2 md:hidden">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="size-4" />
              목록으로
            </Button>
          </div>
        ) : null}
        {detail}
      </div>
    </div>
  )
}

export { ListDetailPanel }
