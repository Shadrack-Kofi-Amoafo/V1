import { GitBranch, Sparkles } from 'lucide-react'

export function StatusBar({ language }: { language: string }) {
  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-sidebar px-3 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <GitBranch className="size-3" strokeWidth={1.75} />
          main
        </span>
        <span>0 problems</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Sparkles className="size-3" strokeWidth={1.75} />
          Agent ready
        </span>
        <span>UTF-8</span>
        <span className="uppercase">{language}</span>
        <span>Ln 12, Col 24</span>
      </div>
    </footer>
  )
}
