export type FileNode = {
  name: string
  type: 'file' | 'folder'
  path: string
  language?: 'tsx' | 'ts' | 'css' | 'json' | 'md'
  children?: FileNode[]
}

export const fileTree: FileNode[] = [
  {
    name: 'app',
    type: 'folder',
    path: 'app',
    children: [
      {
        name: 'api',
        type: 'folder',
        path: 'app/api',
        children: [
          {
            name: 'chat',
            type: 'folder',
            path: 'app/api/chat',
            children: [
              {
                name: 'route.ts',
                type: 'file',
                path: 'app/api/chat/route.ts',
                language: 'ts',
              },
            ],
          },
        ],
      },
      { name: 'layout.tsx', type: 'file', path: 'app/layout.tsx', language: 'tsx' },
      { name: 'page.tsx', type: 'file', path: 'app/page.tsx', language: 'tsx' },
      { name: 'globals.css', type: 'file', path: 'app/globals.css', language: 'css' },
    ],
  },
  {
    name: 'components',
    type: 'folder',
    path: 'components',
    children: [
      { name: 'chat-panel.tsx', type: 'file', path: 'components/chat-panel.tsx', language: 'tsx' },
      { name: 'editor.tsx', type: 'file', path: 'components/editor.tsx', language: 'tsx' },
      { name: 'sidebar.tsx', type: 'file', path: 'components/sidebar.tsx', language: 'tsx' },
    ],
  },
  {
    name: 'lib',
    type: 'folder',
    path: 'lib',
    children: [{ name: 'utils.ts', type: 'file', path: 'lib/utils.ts', language: 'ts' }],
  },
  { name: 'package.json', type: 'file', path: 'package.json', language: 'json' },
  { name: 'README.md', type: 'file', path: 'README.md', language: 'md' },
]

export const fileContents: Record<string, string> = {
  'app/page.tsx': `import { Suspense } from "react"
import { ChatPanel } from "@/components/chat-panel"
import { WorkspaceHeader } from "@/components/workspace-header"

interface PageProps {
  searchParams: Promise<{ session?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const { session } = await searchParams
  const isActive = session !== undefined

  return (
    <main className="flex h-screen flex-col">
      <WorkspaceHeader title="untitled-workspace" active={isActive} />
      <Suspense fallback={null}>
        <ChatPanel sessionId={session ?? "default"} />
      </Suspense>
    </main>
  )
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
`,
  'app/layout.tsx': `import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Editor",
  description: "An AI-native code editor",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
`,
  'app/api/chat/route.ts': `import { streamText, convertToModelMessages } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: "xai/grok-4",
    system: "You are a helpful coding assistant embedded in an editor.",
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
`,
  'components/chat-panel.tsx': `"use client"

import { useState } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!input.trim()) return

    const next: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, next])
    setInput("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {messages.map((message) => (
        <p key={message.id}>{message.content}</p>
      ))}
    </form>
  )
}
`,
  'lib/utils.ts': `export function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(" ")
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 200,
): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}
`,
}

export function flattenFiles(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = []
  for (const node of nodes) {
    if (node.type === 'file') out.push(node)
    if (node.children) out.push(...flattenFiles(node.children))
  }
  return out
}

export type GitChange = {
  path: string
  status: 'modified' | 'added' | 'deleted'
}

export const gitChanges: GitChange[] = [
  { path: 'app/page.tsx', status: 'modified' },
  { path: 'components/chat-panel.tsx', status: 'modified' },
  { path: 'app/api/chat/route.ts', status: 'added' },
  { path: 'lib/utils.ts', status: 'modified' },
]

export type ExtensionInfo = {
  id: string
  name: string
  publisher: string
  description: string
  installed: boolean
}

export const extensions: ExtensionInfo[] = [
  {
    id: 'eslint',
    name: 'ESLint',
    publisher: 'Microsoft',
    description: 'Integrates ESLint into the editor for real-time linting.',
    installed: true,
  },
  {
    id: 'prettier',
    name: 'Prettier',
    publisher: 'Prettier',
    description: 'Opinionated code formatter for JS, TS, CSS, and more.',
    installed: true,
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    description: 'Autocomplete, linting, and syntax highlighting for Tailwind.',
    installed: true,
  },
  {
    id: 'gitlens',
    name: 'GitLens',
    publisher: 'GitKraken',
    description: 'Supercharge Git within the editor with blame and history.',
    installed: false,
  },
]


