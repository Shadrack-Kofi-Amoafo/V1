'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'

type Diagnostic = { file: string; line: number; column: number; message: string; severity: 'error' | 'warning' }

export function TerminalPanel({ onClose, onDiagnostics }: { onClose: () => void; onDiagnostics: (diagnostics: Diagnostic[]) => void }) {
  const [output, setOutput] = useState('Local runner ready. Use Run to execute the project typecheck.\n')
  const [running, setRunning] = useState(false)

  async function run(script: 'typecheck' | 'lint' | 'build') {
    setRunning(true)
    setOutput(`Running pnpm ${script}…\n`)
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      })
      const result = await response.json()
      onDiagnostics(result.diagnostics ?? [])
      setOutput(`${result.output ?? result.error ?? 'No output'}\n\nExit code: ${result.exitCode ?? 0}`)
    } catch (error) {
      setOutput(error instanceof Error ? error.message : 'Runner unavailable')
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="flex h-56 shrink-0 flex-col border-t border-border bg-card" aria-label="Terminal">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">TERMINAL</span>
        <div className="flex items-center gap-1">
          <button type="button" title="Clear terminal" aria-label="Clear terminal" onClick={() => setOutput('')} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <Trash2 className="size-3.5" />
          </button>
          <button type="button" title="Close terminal" aria-label="Close terminal" onClick={onClose} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
        {(['typecheck', 'lint', 'build'] as const).map((script) => (
          <button key={script} type="button" disabled={running} onClick={() => void run(script)} className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50">
            {script}
          </button>
        ))}
      </div>
      <pre className="flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/80">{output}</pre>
    </section>
  )
}
