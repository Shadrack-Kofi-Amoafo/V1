'use client'

import { useEffect, useRef } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'

type Diagnostic = { file: string; line: number; column: number; message: string; severity: 'error' | 'warning' }
function languageForPath(path: string) {
  const extension = path.split('.').pop()?.toLowerCase()
  if (extension === 'tsx') return 'typescript'
  if (extension === 'ts') return 'typescript'
  if (extension === 'jsx') return 'javascript'
  if (extension === 'js') return 'javascript'
  if (extension === 'json') return 'json'
  if (extension === 'css') return 'css'
  if (extension === 'md') return 'markdown'
  if (extension === 'html') return 'html'
  return 'plaintext'
}

export function CodeEditor({
  path,
  content,
  onChange,
  onSave,
  diagnostics = [],
}: {
  path: string
  content: string
  onChange: (content: string) => void
  onSave: () => void
  diagnostics?: Diagnostic[]
}) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor?.getModel()
    if (!editor || !monaco || !model) return
    const markers = diagnostics
      .filter((diagnostic) => diagnostic.file === path || diagnostic.file.endsWith(`/${path}`))
      .map((diagnostic) => ({
        startLineNumber: diagnostic.line,
        endLineNumber: diagnostic.line,
        startColumn: diagnostic.column,
        endColumn: diagnostic.column + 1,
        message: diagnostic.message,
        severity: diagnostic.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      }))
    monaco.editor.setModelMarkers(model, 'local-runner', markers)
  }, [diagnostics, path])

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    editor.addCommand(2048 | 49, onSave) // Ctrl/Cmd + S
    editor.addCommand(2048 | 49, onSave) // Ctrl/Cmd + S
  }

  return (
    <div className="flex-1 overflow-hidden bg-background" data-editor-path={path}>
      <Editor
        height="100%"
        defaultLanguage={languageForPath(path)}
        language={languageForPath(path)}
        value={content}
        onChange={(value) => onChange(value ?? '')}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: 13,
          lineHeight: 22,
          minimap: { enabled: false },
          padding: { top: 12, bottom: 12 },
          scrollBeyondLastLine: false,
          renderLineHighlight: 'line',
          tabSize: 2,
          wordWrap: 'off',
        }}
      />
    </div>
  )
}
