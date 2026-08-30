'use client'

import { useEffect, useState } from 'react'
import { ActivityRail } from '@/components/ide/activity-rail'
import { FileExplorer } from '@/components/ide/file-explorer'
import { SearchPanel } from '@/components/ide/search-panel'
import { SourceControlPanel } from '@/components/ide/source-control-panel'
import { ExtensionsPanel } from '@/components/ide/extensions-panel'
import { EditorTabs } from '@/components/ide/editor-tabs'
import { CodeEditor } from '@/components/ide/code-editor'
import { ChatPanel } from '@/components/ide/chat-panel'
import { TitleBar } from '@/components/ide/title-bar'
import { StatusBar } from '@/components/ide/status-bar'
import { QuickOpen } from '@/components/ide/quick-open'
import { fileTree as initialFileTree, fileContents, type FileNode } from '@/lib/ide-data'

function findNode(nodes: FileNode[], path: string): FileNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.children) {
      const found = findNode(node.children, path)
      if (found) return found
    }
  }
  return undefined
}

function languageForPath(path: string): FileNode['language'] {
  const ext = path.split('.').pop()
  if (ext === 'tsx' || ext === 'ts' || ext === 'css' || ext === 'json' || ext === 'md') {
    return ext
  }
  return undefined
}

function insertFileNode(nodes: FileNode[], path: string): FileNode[] {
  const segments = path.split('/')
  const [head, ...rest] = segments

  const existingIndex = nodes.findIndex((n) => n.name === head)

  if (rest.length === 0) {
    if (existingIndex !== -1) return nodes
    const fileNode: FileNode = { name: head, type: 'file', path, language: languageForPath(path) }
    return [...nodes, fileNode]
  }

  const childPath = rest.join('/')
  if (existingIndex !== -1 && nodes[existingIndex].type === 'folder') {
    const folder = nodes[existingIndex]
    const updatedFolder: FileNode = {
      ...folder,
      children: insertFileNode(folder.children ?? [], childPath),
    }
    return nodes.map((n, i) => (i === existingIndex ? updatedFolder : n))
  }

  const folderPath = nodes.length > 0 ? path.slice(0, path.length - childPath.length - 1) : head
  const newFolder: FileNode = {
    name: head,
    type: 'folder',
    path: folderPath,
    children: insertFileNode([], childPath),
  }
  return [...nodes, newFolder]
}

const DEFAULT_TABS = ['app/layout.tsx', 'app/page.tsx', 'components/chat-panel.tsx']

type SidebarView = 'files' | 'search' | 'git' | 'extensions'

export function IdeWorkspace() {
  const [openPaths, setOpenPaths] = useState<string[]>(DEFAULT_TABS)
  const [activePath, setActivePath] = useState('app/page.tsx')
  const [chatOpen, setChatOpen] = useState(true)
  const [sidebarView, setSidebarView] = useState<SidebarView>('files')
  const [quickOpenOpen, setQuickOpenOpen] = useState(false)
  const [fileTree, setFileTree] = useState<FileNode[]>(initialFileTree)
  const [files, setFiles] = useState<Record<string, string>>(fileContents)

  const openTabs = openPaths
    .map((path) => findNode(fileTree, path))
    .filter((n): n is FileNode => Boolean(n))

  const activeNode = findNode(fileTree, activePath)

  function editFile(path: string, content: string) {
    setFiles((prev) => ({ ...prev, [path]: content }))
    setFileTree((prev) => (findNode(prev, path) ? prev : insertFileNode(prev, path)))
    setOpenPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActivePath(path)
  }

  function openFile(node: FileNode) {
    if (node.type !== 'file') return
    setOpenPaths((prev) => (prev.includes(node.path) ? prev : [...prev, node.path]))
    setActivePath(node.path)
  }

  function closeTab(path: string) {
    setOpenPaths((prev) => {
      const next = prev.filter((p) => p !== path)
      if (activePath === path && next.length > 0) {
        setActivePath(next[next.length - 1])
      }
      return next
    })
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setQuickOpenOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TitleBar
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
        onOpenQuickOpen={() => setQuickOpenOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <ActivityRail active={sidebarView} onSelect={(id) => setSidebarView(id as SidebarView)} />

        <div className="w-60 shrink-0 border-r border-border bg-sidebar">
          {sidebarView === 'files' && (
            <FileExplorer tree={fileTree} selectedPath={activePath} onSelectFile={openFile} />
          )}
          {sidebarView === 'search' && <SearchPanel onSelectFile={openFile} />}
          {sidebarView === 'git' && <SourceControlPanel />}
          {sidebarView === 'extensions' && <ExtensionsPanel />}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <EditorTabs
            tabs={openTabs}
            activePath={activePath}
            onSelect={setActivePath}
            onClose={closeTab}
          />
          {activeNode && (
            <CodeEditor path={activeNode.path} content={files[activeNode.path] ?? ''} />
          )}
        </div>

        {chatOpen && (
          <div className="w-[360px] shrink-0 border-l border-border">
            <ChatPanel files={files} onEditFile={editFile} onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>
      <StatusBar language={activeNode?.language ?? 'plaintext'} />

      <QuickOpen open={quickOpenOpen} onOpenChange={setQuickOpenOpen} onSelectFile={openFile} />
    </div>
  )
}
