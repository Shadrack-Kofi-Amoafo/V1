'use client'

import { Files, Search, GitBranch, Blocks, Settings, UserRound, LogOut, Palette, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TOP_ITEMS = [
  { id: 'files', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'extensions', icon: Blocks, label: 'Extensions' },
] as const

export function ActivityRail({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <nav
      aria-label="Primary"
      className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-border bg-sidebar py-2"
    >
      <div className="flex flex-col items-center gap-1">
        {TOP_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-pressed={isActive}
              onClick={() => onSelect(item.id)}
              className={cn(
                'relative flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'text-foreground',
              )}
            >
              {isActive && (
                <span className="absolute left-0 h-5 w-0.5 rounded-full bg-foreground" aria-hidden="true" />
              )}
              <Icon className="size-[18px]" strokeWidth={1.75} />
            </button>
          )
        })}
      </div>
      <div className="flex flex-col items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Settings"
                className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              />
            }
          >
            <Settings className="size-[18px]" strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Palette data-icon="inline-start" />
                Theme
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Keyboard data-icon="inline-start" />
                Keyboard Shortcuts
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Account"
                className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              />
            }
          >
            <UserRound className="size-[18px]" strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>alex@editor.dev</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut data-icon="inline-start" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
