'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { ArrowUp, AtSign, Check, ChevronDown, FileCode, Sparkles, X } from 'lucide-react'
import { flattenFiles, fileTree } from '@/lib/ide-data'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const MODES = ['Agent', 'Ask'] as const

const MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { id: 'openai/gpt-5.1-codex', label: 'GPT-5.1 Codex' },
  { id: 'openai/gpt-5-mini-fast', label: 'GPT-5 mini (fast)' },
] as const

export function ChatPanel({
  files,
  onEditFile,
  onClose,
}: {
  files: Record<string, string>
  onEditFile: (path: string, content: string) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<(typeof MODES)[number]>('Agent')
  const [model, setModel] = useState<(typeof MODELS)[number]>(MODELS[0])
  const [value, setValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const allFiles = flattenFiles(fileTree)

  const { messages, sendMessage, addToolOutput, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return

      if (toolCall.toolName === 'editFile') {
        const { path, content } = toolCall.input as { path: string; content: string }
        onEditFile(path, content)
        addToolOutput({
          tool: 'editFile',
          toolCallId: toolCall.toolCallId,
          output: `Applied edit to ${path}`,
        })
      }
    },
  })

  const isBusy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isBusy])

  function send() {
    const trimmed = value.trim()
    if (!trimmed || isBusy) return

    sendMessage({ text: trimmed }, { body: { model: model.id, mode, files } })
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      send()
    }
  }

  function mentionFile(path: string) {
    setValue((prev) => (prev.endsWith(' ') || prev.length === 0 ? `${prev}@${path} ` : `${prev} @${path} `))
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          <Sparkles className="size-[15px]" strokeWidth={1.75} />
          <span>Chat</span>
        </div>
        <button
          type="button"
          aria-label="Close chat panel"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <ol className="flex flex-col gap-5">
          {messages.length === 0 && (
            <li className="rounded-lg border border-dashed border-border px-3 py-4 text-[12.5px] leading-relaxed text-muted-foreground">
              Ask the AI to explain, review, or change your code. In Agent mode it can edit files
              directly — try &quot;add a loading state to the chat panel&quot;.
            </li>
          )}
          {messages.map((message) => (
            <li key={message.id}>
              {message.role === 'user' ? (
                <div className="ml-auto max-w-[92%] rounded-xl bg-secondary px-3 py-2 text-[13px] leading-relaxed text-secondary-foreground">
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                    <Sparkles className="size-3.5" strokeWidth={1.75} />
                    <span>Assistant</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return (
                          <p key={index} className="text-[13px] leading-relaxed text-foreground/90">
                            {part.text}
                          </p>
                        )
                      }

                      if (part.type === 'tool-editFile') {
                        const input = part.input as { path?: string } | undefined
                        const path = input?.path

                        return (
                          <span
                            key={index}
                            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] text-muted-foreground"
                          >
                            {part.state === 'output-available' ? (
                              <Check className="size-3 text-emerald-500" strokeWidth={2} />
                            ) : (
                              <FileCode className="size-3 animate-pulse" strokeWidth={1.75} />
                            )}
                            {part.state === 'output-available' ? 'Edited ' : 'Editing '}
                            {path ?? '…'}
                          </span>
                        )
                      }

                      return null
                    })}
                  </div>
                </div>
              )}
            </li>
          ))}
          {isBusy && messages[messages.length - 1]?.role !== 'assistant' && (
            <li className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
              <Sparkles className="size-3.5 animate-pulse" strokeWidth={1.75} />
              <span className="animate-pulse">Thinking…</span>
            </li>
          )}
          {error && (
            <li className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12.5px] leading-relaxed text-destructive">
              Something went wrong talking to the model. Check that an AI Gateway key is configured.
            </li>
          )}
        </ol>
      </div>

      <div className="shrink-0 p-3 pt-0">
        <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI, or type @ to mention a file"
            rows={3}
            className="w-full resize-none bg-transparent px-1 pt-1 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 rounded-full border border-border bg-secondary/60 p-0.5">
                {MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                      mode === m
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Mention a file"
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    />
                  }
                >
                  <AtSign className="size-3.5" strokeWidth={1.75} />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start">
                  {allFiles.map((file) => (
                    <DropdownMenuItem key={file.path} onClick={() => mentionFile(file.path)}>
                      <FileCode data-icon="inline-start" />
                      {file.path}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
                    />
                  }
                >
                  {model.label}
                  <ChevronDown className="size-3" strokeWidth={2} />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end">
                  {MODELS.map((m) => (
                    <DropdownMenuItem key={m.id} onClick={() => setModel(m)}>
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                aria-label="Send message"
                onClick={send}
                className="flex size-6 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-85 disabled:opacity-40"
                disabled={value.trim().length === 0 || isBusy}
              >
                <ArrowUp className="size-3.5" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
