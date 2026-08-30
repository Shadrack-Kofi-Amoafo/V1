import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

const ROOT = process.cwd()
const MAX_FILE_BYTES = 2 * 1024 * 1024
const IGNORED = new Set(['.git', '.next', 'node_modules', 'dist', 'build', 'coverage', '.env', '.env.local'])
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.html', '.yml', '.yaml', '.toml', '.txt', '.svg'])

type WorkspaceFile = { path: string; content: string }

type WorkspaceNode = {
  name: string
  type: 'file' | 'folder'
  path: string
  language?: 'tsx' | 'ts' | 'css' | 'json' | 'md'
  children?: WorkspaceNode[]
}

function languageFor(filePath: string): WorkspaceNode['language'] {
  const ext = path.extname(filePath)
  if (ext === '.tsx' || ext === '.ts') return ext.slice(1) as 'tsx' | 'ts'
  if (ext === '.css') return 'css'
  if (ext === '.json') return 'json'
  if (ext === '.md') return 'md'
  return undefined
}

function safePath(relativePath: string) {
  const normalized = path.normalize(relativePath)
  const absolute = path.resolve(ROOT, normalized)
  if (absolute !== ROOT && !absolute.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error('Path is outside the workspace')
  }
  if (normalized.split(path.sep).some((segment) => IGNORED.has(segment))) {
    throw new Error('Path is not editable')
  }
  return absolute
}

async function collect(directory: string, relativeDirectory = ''): Promise<{ files: WorkspaceFile[]; tree: WorkspaceNode[] }> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: WorkspaceFile[] = []
  const tree: WorkspaceNode[] = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (IGNORED.has(entry.name)) continue
    const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      const nested = await collect(absolutePath, relativePath)
      if (nested.tree.length > 0) {
        tree.push({ name: entry.name, type: 'folder', path: relativePath, children: nested.tree })
        files.push(...nested.files)
      }
      continue
    }

    if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue
    const fileStat = await stat(absolutePath)
    if (fileStat.size > MAX_FILE_BYTES) continue
    const content = await readFile(absolutePath, 'utf8')
    files.push({ path: relativePath, content })
    tree.push({ name: entry.name, type: 'file', path: relativePath, language: languageFor(relativePath) })
  }

  return { files, tree }
}

export async function GET() {
  try {
    const workspace = await collect(ROOT)
    return NextResponse.json(workspace)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to read workspace' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { path?: string; content?: string }
    if (!body.path || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'path and content are required' }, { status: 400 })
    }
    if (Buffer.byteLength(body.content, 'utf8') > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File is too large' }, { status: 413 })
    }
    const absolutePath = safePath(body.path)
    await writeFile(absolutePath, body.content, 'utf8')
    return NextResponse.json({ ok: true, path: body.path })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save file' }, { status: 400 })
  }
}
