'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { TerminalPanel } from '@/components/ide/terminal-panel'
import { fileTree as fallbackFileTree, fileContents as fallbackFileContents, type FileNode } from '@/lib/ide-data'

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
  const [fileTree, setFileTree] = useState<FileNode[]>(fallbackFileTree)
  const [files, setFiles] = useState<Record<string, string>>(fallbackFileContents)
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set())
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [terminalOpen, setTerminalOpen] = useState(false)

  async function loadWorkspace(selectFirst = false) {
    const response = await fetch('/api/workspace')
    if (!response.ok) throw new Error('Unable to load the local workspace')
    const workspace = await response.json() as { tree: FileNode[]; files: { path: string; content: string }[] }
    setFileTree(workspace.tree)
    setFiles(Object.fromEntries(workspace.files.map((file) => [file.path, file.content])))
    if (selectFirst) {
      const firstFile = workspace.files[0]?.path
      if (firstFile) {
        setOpenPaths([firstFile])
        setActivePath(firstFile)
      }
    }
  }

  useEffect(() => {
    loadWorkspace(true).catch((error: unknown) => setWorkspaceError(error instanceof Error ? error.message : 'Workspace unavailable'))
  }, [])

  async function createWorkspaceItem(type: 'file' | 'folder') {
    const itemPath = window.prompt(`Path for new ${type} (relative to the workspace)`)
    if (!itemPath?.trim()) return
    const response = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', type, path: itemPath.trim() }),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      setWorkspaceError(result.error ?? `Unable to create ${type}`)
      return
    }
    await loadWorkspace()
    if (type === 'file') {
      const path = itemPath.trim()
      setOpenPaths((previous) => previous.includes(path) ? previous : [...previous, path])
      setActivePath(path)
    }
  }

  const openTabs = openPaths
    .map((path) => findNode(fileTree, path))
    .filter((n): n is FileNode => Boolean(n))

  const activeNode = findNode(fileTree, activePath)

  function updateFile(path: string, content: string) {
    setFiles((prev) => ({ ...prev, [path]: content }))
    setDirtyPaths((prev) => new Set(prev).add(path))
  }

  function editFile(path: string, content: string) {
    updateFile(path, content)
    setFileTree((prev) => (findNode(prev, path) ? prev : insertFileNode(prev, path)))
    setOpenPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActivePath(path)
  }

  async function saveFile(path: string) {
    const response = await fetch('/api/workspace', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content: files[path] ?? '' }),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      setWorkspaceError(result.error ?? 'Unable to save file')
      return
    }
    setDirtyPaths((prev) => {
      const next = new Set(prev)
      next.delete(path)
      return next
    })
  }

  async function renameWorkspaceItem(node: FileNode) {
    const nextName = window.prompt('New path', node.path)?.trim()
    if (!nextName || nextName === node.path) return
    const response = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rename', path: node.path, newPath: nextName }),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      setWorkspaceError(result.error ?? 'Unable to rename item')
      return
    }
    setOpenPaths((previous) => previous.map((path) => path === node.path ? nextName : path))
    if (activePath === node.path) setActivePath(nextName)
    await loadWorkspace()
  }

  async function deleteWorkspaceItem(node: FileNode) {
    if (!window.confirm(`Delete ${node.path}? This cannot be undone.`)) return
    const response = await fetch('/api/workspace', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: node.path }),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      setWorkspaceError(result.error ?? 'Unable to delete item')
      return
    }
    setOpenPaths((previous) => previous.filter((path) => path !== node.path && !path.startsWith(`${node.path}/`)))
    if (activePath === node.path || activePath.startsWith(`${node.path}/`)) setActivePath('')
    await loadWorkspace()
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
        onRun={() => setTerminalOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <ActivityRail active={sidebarView} onSelect={(id) => setSidebarView(id as SidebarView)} />

        <div className="w-60 shrink-0 border-r border-border bg-sidebar">
          {sidebarView === 'files' && (
            <FileExplorer tree={fileTree} selectedPath={activePath} onSelectFile={openFile} onCreate={(type) => void createWorkspaceItem(type)} onRename={(node) => void renameWorkspaceItem(node)} onDelete={(node) => void deleteWorkspaceItem(node)} />
          )}
          {sidebarView === 'search' && <SearchPanel onSelectFile={openFile} tree={fileTree} fileContents={files} />}
          {sidebarView === 'git' && <SourceControlPanel />}
          {sidebarView === 'extensions' && <ExtensionsPanel />}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <EditorTabs
            tabs={openTabs}
            activePath={activePath}
            onSelect={setActivePath}
            onClose={closeTab}
            dirtyPaths={dirtyPaths}
          />
          {workspaceError && (
            <div className="border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {workspaceError}
            </div>
          )}
          {activeNode && (
            <CodeEditor
              key={activeNode.path}
              path={activeNode.path}
              content={files[activeNode.path] ?? ''}
              onChange={(content) => updateFile(activeNode.path, content)}
              onSave={() => void saveFile(activeNode.path)}
            />
          )}
          {terminalOpen && <TerminalPanel onClose={() => setTerminalOpen(false)} />}
        </div>

        {chatOpen && (
          <div className="w-[360px] shrink-0 border-l border-border">
            <ChatPanel files={files} tree={fileTree} onEditFile={editFile} onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>
      <StatusBar language={activeNode?.language ?? 'plaintext'} />

      <QuickOpen open={quickOpenOpen} onOpenChange={setQuickOpenOpen} onSelectFile={openFile} tree={fileTree} />
    </div>
  )
}
