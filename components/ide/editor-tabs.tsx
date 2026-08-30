'use client'

import { X } from 'lucide-react'
import type { FileNode } from '@/lib/ide-data'
import { cn } from '@/lib/utils'

export function EditorTabs({
  tabs,
  activePath,
  onSelect,
  onClose,
}: {
  tabs: FileNode[]
  activePath: string
  onSelect: (path: string) => void
  onClose: (path: string) => void
}) {
  return (
    <div role="tablist" aria-label="Open files" className="flex h-10 shrink-0 items-stretch overflow-x-auto border-b border-border bg-card">
      {tabs.map((tab) => {
        const isActive = tab.path === activePath
        return (
          <div
            key={tab.path}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'group relative flex min-w-[130px] shrink-0 cursor-pointer items-center gap-2 border-r border-border px-3 text-[13px] transition-colors',
              isActive ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-accent/50',
            )}
            onClick={() => onSelect(tab.path)}
          >
            {isActive && (
              <span className="absolute inset-x-0 top-0 h-[1.5px] bg-foreground" aria-hidden="true" />
            )}
            <span className="truncate">{tab.name}</span>
            <button
              type="button"
              aria-label={`Close ${tab.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.path)
              }}
              className="ml-auto flex size-4 shrink-0 items-center justify-center rounded opacity-0 hover:bg-secondary group-hover:opacity-100"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
