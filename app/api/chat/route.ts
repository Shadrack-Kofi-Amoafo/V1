import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5'
const ALLOWED_MODELS = new Set([
  DEFAULT_MODEL,
  'openai/gpt-5.1-codex',
  'openai/gpt-5-mini-fast',
])
const MAX_FILES = 200
const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_CONTEXT_BYTES = 8 * 1024 * 1024

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.messages)) {
    return Response.json({ error: 'messages must be an array' }, { status: 400 })
  }

  const messages = body.messages as UIMessage[]
  const model = typeof body.model === 'string' && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL
  const mode = body.mode === 'Ask' ? 'Ask' : 'Agent'
  const files = body.files && typeof body.files === 'object' ? body.files as Record<string, string> : {}
  const entries = Object.entries(files)
  if (entries.length > MAX_FILES || entries.some(([, content]) => typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES)) {
    return Response.json({ error: 'Workspace context is too large or contains invalid files' }, { status: 413 })
  }
  const contextBytes = entries.reduce((total, [path, content]) => total + Buffer.byteLength(path + content, 'utf8'), 0)
  if (contextBytes > MAX_CONTEXT_BYTES) {
    return Response.json({ error: 'Workspace context exceeds the agent limit' }, { status: 413 })
  }

  const isAgent = mode !== 'Ask'

  const fileListing = files
    ? Object.entries(files)
        .map(([path, content]) => `--- ${path} ---\n${content}`)
        .join('\n\n')
    : 'No files are currently open.'

  const system = `You are an AI pair programmer embedded in a code editor, similar to Cursor or v0.

Here are the full contents of every file currently in the project:

${fileListing}

Only reference files that actually appear above — never invent paths.
${
  isAgent
    ? `You are in Agent mode. When the user asks for a code change, call the "editFile" tool with the file's full new content (not a diff — the entire file, top to bottom). After calling the tool, briefly explain what changed in plain language. You may call the tool multiple times for multi-file changes. Keep unrelated code untouched.`
    : `You are in Ask mode. Answer questions about the code and suggest changes in words, but do not attempt to edit any files.`
}`

  const result = streamText({
    model: model || DEFAULT_MODEL,
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: isAgent
      ? {
          editFile: tool({
            description:
              "Overwrite a file's contents with new code. Provide the complete new file content, not just the changed lines.",
            inputSchema: z.object({
              path: z.string().describe('The exact file path to edit, e.g. app/page.tsx'),
              content: z.string().describe('The complete new content of the file'),
            }),
          }),
          runCommand: tool({
            description: 'Run a safe local project command to validate or inspect the workspace. Use npm or pnpm scripts, git status/diff, or node commands.',
            inputSchema: z.object({
              command: z.string().describe('The local command to run, for example npm run typecheck or git diff --check'),
            }),
          }),
        }
      : undefined,
  })

  return result.toUIMessageStreamResponse()
}
