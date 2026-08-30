'use client'

import Editor, { type OnMount } from '@monaco-editor/react'
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
}: {
  path: string
  content: string
  onChange: (content: string) => void
  onSave: () => void
}) {
  const handleMount: OnMount = (editor) => {
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
