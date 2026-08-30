'use client'

import { useState } from 'react'
import { Check, FileCode, Plus, Minus, Pencil } from 'lucide-react'
import { gitChanges } from '@/lib/ide-data'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  modified: { label: 'M', icon: Pencil, color: 'var(--syntax-number)' },
  added: { label: 'A', icon: Plus, color: 'var(--syntax-string)' },
  deleted: { label: 'D', icon: Minus, color: 'var(--syntax-tag)' },
} as const

export function SourceControlPanel() {
  const [message, setMessage] = useState('')
  const [committed, setCommitted] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-3 pt-3 pb-2">
        <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground">SOURCE CONTROL</h2>
      </div>
      <div className="px-3 pb-2">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setCommitted(false)
          }}
          placeholder="Commit message"
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-card px-2 py-1.5 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          disabled={message.trim().length === 0}
          onClick={() => setCommitted(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          <Check className="size-3.5" strokeWidth={2} />
          {committed ? 'Committed' : `Commit to main`}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">
          CHANGES ({gitChanges.length})
        </p>
        <ul className="flex flex-col gap-0.5">
          {gitChanges.map((change) => {
            const config = STATUS_CONFIG[change.status]
            return (
              <li key={change.path}>
                <div className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                  <FileCode className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  <span className="truncate text-[12.5px] text-foreground/85">{change.path}</span>
                  <span
                    className="ml-auto shrink-0 text-[11px] font-semibold"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
