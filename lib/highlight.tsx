import type { ReactNode } from 'react'

const TOKEN_RE =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][A-Za-z0-9.]*)|(\b(?:const|let|var|function|return|import|export|from|default|async|await|if|else|for|while|new|class|extends|interface|type|as|of|in|try|catch|finally|throw|switch|case|break|continue|typeof|instanceof|void|null|undefined|true|false|this|super|public|private|readonly|satisfies)\b)|(\b(?:string|number|boolean|any|unknown|never|React|Promise)\b|\b[A-Z][A-Za-z0-9_]*\b)|(\b\d+(?:\.\d+)?\b)/g

const STYLES: Record<number, string> = {
  1: 'var(--syntax-comment)',
  2: 'var(--syntax-string)',
  3: 'var(--syntax-tag)',
  4: 'var(--syntax-keyword)',
  5: 'var(--syntax-type)',
  6: 'var(--syntax-number)',
}

/** Lightweight regex-based syntax highlighter for the mock editor. Not a full parser. */
export function highlightLine(line: string, key: string): ReactNode {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  TOKEN_RE.lastIndex = 0
  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index))
    }
    const groupIndex = match.slice(1).findIndex((g) => g !== undefined) + 1
    nodes.push(
      <span key={`${key}-${i++}`} style={{ color: STYLES[groupIndex] }}>
        {match[0]}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex))
  }
  return nodes
}
