export interface CodeBlockData {
  lang: string | null
  text: string
}

/**
 * Extract `{ lang, text }` from a <pre><code> HAST node produced by react-markdown.
 * Used to route the block: mermaid -> diagram, known lang -> Shiki, else plain.
 */
export function codeFromPre(node: unknown): CodeBlockData | null {
  if (!node || typeof node !== 'object') return null
  const pre = node as { type?: string; tagName?: string; children?: unknown[] }
  if (pre.type !== 'element' || pre.tagName !== 'pre') return null
  const code = (pre.children ?? []).find(
    (c) =>
      typeof c === 'object' &&
      c !== null &&
      (c as { tagName?: string }).tagName === 'code',
  ) as
    | { properties?: { className?: unknown }; children?: { type?: string; value?: string }[] }
    | undefined
  if (!code) return null
  const cls = code.properties?.className
  const arr = Array.isArray(cls) ? cls : [cls]
  const langClass = arr.find(
    (c): c is string => typeof c === 'string' && c.startsWith('language-'),
  )
  const lang = langClass ? langClass.replace('language-', '') : null
  const text = (code.children ?? [])
    .map((c) => (c.type === 'text' ? c.value ?? '' : ''))
    .join('')
  return { lang, text: text.replace(/\n$/, '') }
}
