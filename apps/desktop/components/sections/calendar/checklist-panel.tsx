"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import type { ScheduleChecklistItem } from "@app/shared"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/common/empty-state"
import { Input } from "@/components/ui/input"

interface ChecklistPanelProps {
  items: ScheduleChecklistItem[]
  onItemsChange: (items: ScheduleChecklistItem[]) => void
}

function ChecklistPanel({ items, onItemsChange }: ChecklistPanelProps) {
  const [label, setLabel] = useState("")

  function addItem() {
    const trimmed = label.trim()
    if (!trimmed) {
      return
    }

    onItemsChange([
      ...items,
      { id: crypto.randomUUID(), label: trimmed, done: false },
    ])
    setLabel("")
  }

  function toggleItem(id: string) {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  function removeItem(id: string) {
    onItemsChange(items.filter((item) => item.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          placeholder="체크리스트 항목 추가"
          aria-label="체크리스트 항목 추가"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              addItem()
            }
          }}
        />
        <Button type="button" size="icon" aria-label="항목 추가" onClick={addItem}>
          <Plus />
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="체크리스트 항목이 없습니다" className="p-4" />
      ) : (
        <ul className="flex flex-col gap-1.5" role="list">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
            >
              <Checkbox
                checked={item.done}
                onCheckedChange={() => toggleItem(item.id)}
                aria-label={`${item.label} 완료 여부`}
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.done && "text-muted-foreground line-through"
                )}
              >
                {item.label}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${item.label} 삭제`}
                onClick={() => removeItem(item.id)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { ChecklistPanel }
