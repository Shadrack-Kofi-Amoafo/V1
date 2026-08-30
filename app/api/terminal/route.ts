import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { NextResponse } from 'next/server'

const execFileAsync = promisify(execFile)
const ALLOWED_BINARIES = new Set(['npm', 'pnpm', 'node', 'git', 'npx'])

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { command?: string } | null
  const command = body?.command?.trim() ?? ''
  const parts = command.match(/(?:[^\s"']|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^['"]|['"]$/g, '')) ?? []
  const [binary, ...args] = parts

  if (!binary || !ALLOWED_BINARIES.has(binary) || args.some((arg) => arg.includes('&&') || arg.includes('||') || arg.includes(';') || arg.includes('|'))) {
    return NextResponse.json({ error: 'Only approved local commands are allowed' }, { status: 400 })
  }

  try {
    const result = await execFileAsync(binary, args, {
      cwd: process.cwd(),
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, CI: '1' },
    })
    return NextResponse.json({ ok: true, output: `${result.stdout}${result.stderr}`, exitCode: 0 })
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string; code?: number | string }
    return NextResponse.json({
      ok: false,
      output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
      exitCode: result.code ?? 1,
    }, { status: 422 })
  }
}
