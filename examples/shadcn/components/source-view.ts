export type SourceExcerpt = { code: string; startLine: number; endLine: number }
export type SourceToken = { text: string; kind?: 'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'property' }

/** Return exact source bytes; never synthesize a parallel example implementation. */
export function extractAdapterSource(source: string, _framework: 'react' | 'vue', component: string): SourceExcerpt[] {
  const lines = source.split('\n')
  const excerpt = (start: number, end: number): SourceExcerpt => ({
    code: lines.slice(start, end).join('\n'), startLine: start + 1, endLine: end,
  })
  if (component === 'settings') return [{ code: source, startLine: 1, endLine: lines.length }]
  const ranges: [number, number][] = []
  let start = -1
  let section = ''
  for (let index = 0; index < lines.length; index++) {
    const opening = lines[index].match(/@source-start:\s*([\w-]+)/)
    if (opening) { section = opening[1]; start = index + 1 }
    const closing = lines[index].match(/@source-end:\s*([\w-]+)/)
    if (closing && closing[1] === section && start >= 0) {
      if (section === component || section === 'shared' || (section === 'demo-setup' && (component === 'tabs' || component === 'dialog')) || (section === 'controls-setup' && (component === 'switch' || component === 'checkbox'))) ranges.push([start, index])
      start = -1
    }
  }
  if (ranges.some(([start, end]) => lines.slice(start, end).some(line => line.includes(`<${component[0].toUpperCase() + component.slice(1)}.`)))) {
    return ranges.filter(([start, end]) => end > start).map(([start, end]) => excerpt(start, end))
  }
  // Missing boundaries must never create a fabricated or incomplete fallback.
  return [{ code: source, startLine: 1, endLine: lines.length }]
}

/** Lightweight lexical coloring, bounded even for the full minified CSS bundle. */
export function tokenizeSource(code: string): SourceToken[] {
  const limit = 60_000
  const input = code.slice(0, limit)
  const pattern = /\/\*[\s\S]*?\*\/|<!--[^]*?-->|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|from|export|function|return|const|let|if|else|type|as|true|false|null|undefined|new|async|await)\b|<\/?[A-Za-z][\w.:-]*|--[\w-]+|\b\d+(?:\.\d+)?(?:px|rem|em|ms|s|%)?\b/g
  const tokens: SourceToken[] = []
  let offset = 0
  for (const match of input.matchAll(pattern)) {
    if (tokens.length >= 12_000) break
    const index = match.index!
    if (index > offset) tokens.push({ text: input.slice(offset, index) })
    const text = match[0]
    const kind = text.startsWith('/*') || text.startsWith('//') || text.startsWith('<!--') ? 'comment'
      : /^["'`]/.test(text) ? 'string'
      : text.startsWith('<') ? 'tag'
      : text.startsWith('--') ? 'property'
      : /^\d/.test(text) ? 'number' : 'keyword'
    tokens.push({ text, kind })
    offset = index + text.length
  }
  if (offset < code.length) tokens.push({ text: code.slice(offset) })
  return tokens
}
