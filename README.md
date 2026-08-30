# Cursor Interface Clone

A Cursor-inspired AI code editor interface built with Next.js. It renders a full IDE
shell in the browser — activity rail, file explorer, editor tabs, syntax-highlighted
code view, status bar, ⌘P quick-open — around an AI chat panel that can actually edit
the files it is shown.

The editor operates on an in-memory **virtual filesystem** (defined in `lib/ide-data.ts`),
not your real disk. Nothing the assistant writes touches the repository.

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
  api/chat/route.ts   streaming chat endpoint, exposes the editFile tool
components/
  ide/                the IDE surface (11 components)
  ui/                 shadcn primitives
lib/
  ide-data.ts         virtual filesystem, git + extension fixtures
  highlight.tsx       regex-based syntax highlighter
```

### State

`components/ide/ide-workspace.tsx` is the single stateful hub. It owns the open tabs,
active path, sidebar view, chat visibility, and the virtual filesystem (`fileTree` plus
a `path -> content` map), and passes handlers down. Every other IDE component is
presentational or locally stateful.

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

- Search, source control, and extensions panels read from static arrays in `lib/ide-data.ts`.
- The ▶ Run button is a `setTimeout`, not a build.
- The status bar's `Ln 12, Col 24` and problem count are hardcoded.
- The editor is a read-only `<pre>` with a ~40-line regex highlighter — not Monaco or
  CodeMirror, and not a real parser. Typing in the editor is not wired up.

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
