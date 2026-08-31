import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

const ALLOWED_BINARIES = new Set(['npm', 'pnpm', 'node', 'git', 'npx'])
type ActiveProcess = { child: ChildProcessWithoutNullStreams; output: string; done: boolean; exitCode: number | null }
const processes = new Map<string, ActiveProcess>()

function parseCommand(command: string) {
  return command.match(/(?:[^\s"']|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^['"]|['"]$/g, '')) ?? []
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { command?: string } | null
  const command = body?.command?.trim() ?? ''
  const parts = parseCommand(command)
  const [binary, ...args] = parts
  if (!binary || !ALLOWED_BINARIES.has(binary) || args.some((arg) => /&&|\|\||[;|]/.test(arg))) {
    return NextResponse.json({ error: 'Only approved local commands are allowed' }, { status: 400 })
  }

  const id = randomUUID()
  const child = spawn(binary, args, { cwd: process.cwd(), env: { ...process.env, CI: '1' }, shell: false })
  const processState: ActiveProcess = { child, output: '', done: false, exitCode: null }
  processes.set(id, processState)
  const append = (chunk: Buffer) => {
    processState.output += chunk.toString()
    if (processState.output.length > 4 * 1024 * 1024) processState.output = processState.output.slice(-4 * 1024 * 1024)
  }
  child.stdout.on('data', append)
  child.stderr.on('data', append)
  child.on('close', (code) => { processState.done = true; processState.exitCode = code ?? 1 })
  child.on('error', (error) => { append(Buffer.from(`\n${error.message}\n`)); processState.done = true; processState.exitCode = 1 })
  return NextResponse.json({ ok: true, id })
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  const processState = id ? processes.get(id) : undefined
  if (!processState) return NextResponse.json({ error: 'Process not found' }, { status: 404 })
  return NextResponse.json({ id, output: processState.output, done: processState.done, exitCode: processState.exitCode })
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  const processState = id ? processes.get(id) : undefined
  if (!processState) return NextResponse.json({ error: 'Process not found' }, { status: 404 })
  if (!processState.done) processState.child.kill('SIGTERM')
  return NextResponse.json({ ok: true, id })
}
