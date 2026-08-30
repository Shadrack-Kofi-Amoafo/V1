'use client'

import { useEffect, useRef } from 'react'

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineCount = Math.max(1, content.split('\n').length)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [path])

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      onSave()
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      const textarea = event.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const next = `${content.slice(0, start)}  ${content.slice(end)}`
      onChange(next)
      requestAnimationFrame(() => {
        textarea.selectionStart = start + 2
        textarea.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="flex flex-1 overflow-auto bg-background" data-editor-path={path}>
      <div className="select-none border-r border-border/50 px-3 py-3 text-right font-mono text-[13px] leading-[1.65] text-muted-foreground/50" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => <div key={index}>{index + 1}</div>)}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        aria-label={`Editing ${path}`}
        className="min-h-full min-w-[700px] flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-[1.65] text-foreground/90 outline-none"
      />
    </div>
  )
}
