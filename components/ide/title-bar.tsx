'use client'

import { useState } from 'react'
import { Check, Loader2, PanelRight, Play, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type RunState = 'idle' | 'running' | 'done'

export function TitleBar({
  chatOpen,
  onToggleChat,
  onOpenQuickOpen,
}: {
  chatOpen: boolean
  onToggleChat: () => void
  onOpenQuickOpen: () => void
}) {
  const [runState, setRunState] = useState<RunState>('idle')

  function handleRun() {
    if (runState !== 'idle') return
    setRunState('running')
    window.setTimeout(() => {
      setRunState('done')
      window.setTimeout(() => setRunState('idle'), 1600)
    }, 1100)
  }

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-sidebar px-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
        </div>
        <span className="text-[13px] font-medium text-foreground/90">ai-editor-clone</span>
      </div>

      <button
        type="button"
        onClick={onOpenQuickOpen}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <Search className="size-3.5" strokeWidth={1.75} />
        <span>Go to file</span>
        <kbd className="ml-1 rounded border border-border px-1 text-[10px] text-muted-foreground">⌘P</kbd>
      </button>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Run"
          onClick={handleRun}
          disabled={runState === 'running'}
          className={cn(
            'flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground',
            runState === 'done' && 'text-[var(--syntax-string)]',
          )}
        >
          {runState === 'running' ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
          ) : runState === 'done' ? (
            <Check className="size-3.5" strokeWidth={2} />
          ) : (
            <Play className="size-3.5" strokeWidth={1.75} />
          )}
        </button>
        <button
          type="button"
          aria-label="Toggle AI chat panel"
          aria-pressed={chatOpen}
          onClick={onToggleChat}
          className={cn(
            'flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground',
            chatOpen && 'bg-accent text-foreground',
          )}
        >
          <PanelRight className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
