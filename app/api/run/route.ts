import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { NextResponse } from 'next/server'

const execFileAsync = promisify(execFile)
const ALLOWED_SCRIPTS = new Set(['typecheck', 'lint', 'build'])

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { script?: string } | null
  const script = body?.script ?? 'typecheck'
  if (!ALLOWED_SCRIPTS.has(script)) {
    return NextResponse.json({ error: `Script is not allowed: ${script}` }, { status: 400 })
  }

  try {
    const result = await execFileAsync('npm', ['run', script], {
      cwd: process.cwd(),
      timeout: 120_000,
      maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, CI: '1' },
    })
    return NextResponse.json({ ok: true, script, output: `${result.stdout}${result.stderr}` })
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string; code?: number | string }
    return NextResponse.json({
      ok: false,
      script,
      output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
      exitCode: result.code ?? 1,
    }, { status: 422 })
  }
}
