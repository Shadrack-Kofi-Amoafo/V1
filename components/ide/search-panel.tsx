'use client'

import { useMemo, useState } from 'react'
import { Search, FileCode } from 'lucide-react'
import { flattenFiles, type FileNode } from '@/lib/ide-data'
import { cn } from '@/lib/utils'

export function SearchPanel({
  onSelectFile,
  tree,
  fileContents,
}: {
  onSelectFile: (node: FileNode) => void
  tree: FileNode[]
  fileContents: Record<string, string>
}) {
  const [query, setQuery] = useState('')
  const files = useMemo(() => flattenFiles(tree), [tree])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const matches: { file: FileNode; line: string; lineNumber: number }[] = []
    for (const file of files) {
      const content = fileContents[file.path]
      if (!content) continue
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(q)) {
          matches.push({ file, line: line.trim(), lineNumber: idx + 1 })
        }
      })
    }
    return matches.slice(0, 40)
  }, [query, files])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-3 pt-3 pb-2">
        <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground">SEARCH</h2>
      </div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across files"
            className="w-full bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {query.trim() && (
          <p className="px-2 pb-1 text-[11px] text-muted-foreground">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {results.map((result, idx) => (
            <li key={`${result.file.path}-${result.lineNumber}-${idx}`}>
              <button
                type="button"
                onClick={() => onSelectFile(result.file)}
                className="flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-accent"
              >
                <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-foreground/80">
                  <FileCode className="size-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{result.file.name}</span>
                  <span className="text-muted-foreground">:{result.lineNumber}</span>
                </span>
                <span
                  className={cn(
                    'truncate pl-[18px] font-mono text-[11.5px] text-muted-foreground',
                  )}
                >
                  {result.line}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
