'use client'

import { FileCode } from 'lucide-react'
import { flattenFiles, fileTree, type FileNode } from '@/lib/ide-data'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export function QuickOpen({
  open,
  onOpenChange,
  onSelectFile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectFile: (node: FileNode) => void
}) {
  const files = flattenFiles(fileTree)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Go to file" description="Search files by name">
      <Command>
        <CommandInput placeholder="Go to file…" />
        <CommandList>
          <CommandEmpty>No matching files.</CommandEmpty>
          <CommandGroup heading="Files">
            {files.map((file) => (
              <CommandItem
                key={file.path}
                value={file.path}
                onSelect={() => {
                  onSelectFile(file)
                  onOpenChange(false)
                }}
              >
                <FileCode data-icon="inline-start" />
                <span>{file.name}</span>
                <span className="ml-2 truncate text-muted-foreground">{file.path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
