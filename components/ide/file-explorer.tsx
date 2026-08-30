'use client'

import { useState } from 'react'
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode,
  Braces,
  FileText,
  Palette,
} from 'lucide-react'
import type { FileNode } from '@/lib/ide-data'
import { cn } from '@/lib/utils'

function FileIcon({ language }: { language?: FileNode['language'] }) {
  switch (language) {
    case 'tsx':
    case 'ts':
      return <FileCode className="size-[15px] shrink-0" style={{ color: 'var(--syntax-type)' }} strokeWidth={1.75} />
    case 'css':
      return <Palette className="size-[15px] shrink-0" style={{ color: 'var(--syntax-tag)' }} strokeWidth={1.75} />
    case 'json':
      return <Braces className="size-[15px] shrink-0" style={{ color: 'var(--syntax-number)' }} strokeWidth={1.75} />
    default:
      return <FileText className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={1.75} />
  }
}

function Tree({
  nodes,
  depth,
  selectedPath,
  onSelectFile,
}: {
  nodes: FileNode[]
  depth: number
  selectedPath: string
  onSelectFile: (node: FileNode) => void
}) {
  return (
    <ul role="group">
      {nodes.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={depth}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </ul>
  )
}

function TreeItem({
  node,
  depth,
  selectedPath,
  onSelectFile,
}: {
  node: FileNode
  depth: number
  selectedPath: string
  onSelectFile: (node: FileNode) => void
}) {
  const [open, setOpen] = useState(depth < 1)
  const isFolder = node.type === 'folder'
  const isSelected = node.path === selectedPath

  return (
    <li>
      <button
        type="button"
        onClick={() => (isFolder ? setOpen((v) => !v) : onSelectFile(node))}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md py-[5px] pr-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          isSelected && 'bg-accent text-foreground',
        )}
      >
        {isFolder ? (
          <>
            <ChevronRight
              className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-90')}
              strokeWidth={2}
            />
            {open ? (
              <FolderOpen className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={1.75} />
            ) : (
              <Folder className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={1.75} />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" aria-hidden="true" />
            <FileIcon language={node.language} />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && open && node.children && (
        <Tree nodes={node.children} depth={depth + 1} selectedPath={selectedPath} onSelectFile={onSelectFile} />
      )}
    </li>
  )
}

export function FileExplorer({
  tree,
  selectedPath,
  onSelectFile,
}: {
  tree: FileNode[]
  selectedPath: string
  onSelectFile: (node: FileNode) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-3 pt-3 pb-2">
        <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground">EXPLORER</h2>
      </div>
      <div className="px-3 pb-1.5 text-[11px] font-medium text-foreground/80">ai-editor-clone</div>
      <div className="flex-1 overflow-y-auto pb-2">
        <Tree nodes={tree} depth={0} selectedPath={selectedPath} onSelectFile={onSelectFile} />
      </div>
    </div>
  )
}
