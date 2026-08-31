import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { NextResponse } from 'next/server'

const execFileAsync = promisify(execFile)
const ALLOWED_SCRIPTS = new Set(['typecheck', 'lint', 'build'])

type Diagnostic = { file: string; line: number; column: number; message: string; severity: 'error' | 'warning' }

function parseDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const pattern = /([^\s()]+)\((\d+),(\d+)\):\s+(error|warning)\s+[^:]+:\s+(.+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(output)) && diagnostics.length < 200) {
    diagnostics.push({ file: match[1], line: Number(match[2]), column: Number(match[3]), severity: match[4] as 'error' | 'warning', message: match[5] })
  }
  return diagnostics
}

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
    const output = `${result.stdout}${result.stderr}`
    return NextResponse.json({ ok: true, script, output, diagnostics: parseDiagnostics(output) })
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string; code?: number | string }
    return NextResponse.json({
      ok: false,
      script,
      output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
      diagnostics: parseDiagnostics(`${result.stdout ?? ''}${result.stderr ?? ''}`),
      exitCode: result.code ?? 1,
    }, { status: 422 })
  }
}
