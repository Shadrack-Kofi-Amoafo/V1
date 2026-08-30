'use client'

import { highlightLine } from '@/lib/highlight'

export function CodeEditor({ path, content }: { path: string; content: string }) {
  const lines = content.split('\n')

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="min-w-fit px-4 py-3">
        <pre className="font-mono text-[13px] leading-[1.65]">
          <code>
            {lines.map((line, i) => (
              <div key={`${path}-${i}`} className="flex">
                <span
                  className="sticky left-0 mr-4 w-7 shrink-0 select-none text-right text-muted-foreground/50"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="whitespace-pre text-foreground/90">
                  {line.length > 0 ? highlightLine(line, `${path}-${i}`) : '\u00A0'}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
