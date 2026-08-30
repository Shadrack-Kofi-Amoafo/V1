# Cursor Interface Clone

A Cursor-inspired AI code editor interface built with Next.js. It renders a full IDE
shell in the browser — activity rail, file explorer, editor tabs, syntax-highlighted
code view, status bar, ⌘P quick-open — around an AI chat panel that can actually edit
the files it is shown.

The editor runs as a local workspace app: the Next.js server reads and writes the directory
where it is started. The browser receives a workspace snapshot, while saves go through the
local `/api/workspace` bridge. This is intended for local desktop use; do not expose the dev
server to an untrusted network until authentication and sandboxing are added.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS v4 (CSS-first, no `tailwind.config`) |
| Components | shadcn/ui (`base-nova` style, Base UI primitives) |
| AI | Vercel AI SDK v7 + `@ai-sdk/react` |
| Icons | lucide-react |
| Package manager | pnpm |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # add your AI Gateway key
pnpm dev
```

Open http://localhost:3000.

The UI renders fine without a key, but the chat panel will surface an error on send —
see [Environment](#environment).

### Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |

## Environment

`app/api/chat/route.ts` addresses models by AI Gateway ID (`anthropic/claude-sonnet-4.5`,
`openai/gpt-5.1-codex`, `openai/gpt-5-mini-fast`), so it needs gateway credentials:

```
AI_GATEWAY_API_KEY=...
```

On Vercel, the AI Gateway OIDC token is injected automatically and this can be omitted.

## Architecture

```
app/
  page.tsx            renders <IdeWorkspace />
  layout.tsx          Geist fonts, forced dark theme, metadata
  globals.css         Tailwind v4 theme tokens + --syntax-* colors
  api/chat/route.ts       streaming chat endpoint, exposes the editFile tool
  api/workspace/route.ts  local filesystem read/save bridge
components/
  ide/                    the IDE surface
  ui/                     shadcn primitives
lib/
  ide-data.ts             fallback data for panels and types
  highlight.tsx           regex-based syntax highlighter
```

### State

`components/ide/ide-workspace.tsx` is the single stateful hub. It owns the open tabs,
active path, sidebar view, chat visibility, workspace snapshot, and dirty files, and
passes handlers down. The local `/api/workspace` route is the filesystem boundary: it
reads text files from the directory where Next.js is started and writes files on save.

### The agent loop

This is the part that genuinely works end to end:

1. **Chat panel** sends the message with `{ model, mode, files }` — the entire virtual
   filesystem travels in the request body.
2. **Route** inlines every file into the system prompt, then branches on mode.
   *Agent* registers an `editFile` tool (zod schema: `path`, full `content`);
   *Ask* registers no tools and instructs the model to answer in words only.
3. The tool intentionally has **no `execute` function**, so it is not run on the server.
   The client's `onToolCall` handler applies the edit and reports back via `addToolOutput`.
4. `onEditFile` writes the content, creates the tree node if the path is new, opens a
   tab, and focuses it. `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`
   feeds the result back so the model can continue, bounded by `stepCountIs(5)`.

### What is simulated

Deliberately mock, in case you plan to build on this:

- Source control, extensions, and the ▶ Run button are still simulated.
- The status bar's branch, problem count, and encoding are still mostly hardcoded.
- The editor is now an editable textarea with line numbers, save shortcuts, dirty tabs,
  and local saves; it still needs a full editor engine such as Monaco or CodeMirror for
  syntax services, diagnostics, autocomplete, and robust editing.

## Known rough edges

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so type errors do not fail
  the build. Run `pnpm exec tsc --noEmit` to see them.
- The API route trusts the client completely: file contents and the model ID come
  straight from the browser into the prompt, with no size cap and no model allowlist.
  Add both before exposing this publicly.
- Sending the whole filesystem on every turn will hit context limits as the project grows.
- No linter, tests, or CI are configured.

## Credit

Originally scaffolded with [v0.app](https://v0.app).
