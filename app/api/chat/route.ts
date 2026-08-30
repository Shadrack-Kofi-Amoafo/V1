import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5'

export async function POST(req: Request) {
  const {
    messages,
    model,
    mode,
    files,
  }: {
    messages: UIMessage[]
    model?: string
    mode?: 'Agent' | 'Ask'
    files?: Record<string, string>
  } = await req.json()

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
        }
      : undefined,
  })

  return result.toUIMessageStreamResponse()
}
