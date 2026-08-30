'use client'

import { useState } from 'react'
import { Blocks, Check } from 'lucide-react'
import { extensions as initialExtensions } from '@/lib/ide-data'
import { cn } from '@/lib/utils'

export function ExtensionsPanel() {
  const [installedIds, setInstalledIds] = useState(
    () => new Set(initialExtensions.filter((e) => e.installed).map((e) => e.id)),
  )

  function toggle(id: string) {
    setInstalledIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-3 pt-3 pb-2">
        <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground">EXTENSIONS</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        <ul className="flex flex-col gap-1">
          {initialExtensions.map((ext) => {
            const isInstalled = installedIds.has(ext.id)
            return (
              <li key={ext.id} className="rounded-md px-2 py-2 hover:bg-accent">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                    <Blocks className="size-4 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-[12.5px] font-medium text-foreground">{ext.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{ext.publisher}</p>
                    <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                      {ext.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggle(ext.id)}
                      className={cn(
                        'mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                        isInstalled
                          ? 'border border-border text-muted-foreground hover:text-foreground'
                          : 'bg-foreground text-background hover:opacity-85',
                      )}
                    >
                      {isInstalled && <Check className="size-3" strokeWidth={2} />}
                      {isInstalled ? 'Installed' : 'Install'}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
