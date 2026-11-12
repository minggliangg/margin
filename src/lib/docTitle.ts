import { stripFrontMatter } from './frontmatter'
import { stripMarkdownExt } from './files'

/** Title a remote doc from the last URL path segment (or the hostname). */
export function titleFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const seg = stripMarkdownExt(u.pathname.split('/').filter(Boolean).pop() ?? '')
    return seg || u.hostname
  } catch {
    return 'document'
  }
}

/** Title an uploaded file from its name, minus the Markdown extension. */
export function titleFromFile(file: File): string {
  return stripMarkdownExt(file.name)
}

/**
 * Title a pasted doc from its first `#`-heading. Front matter is stripped first
 * so a YAML `---` block (which carries no H1) doesn't shadow the real title;
 * an ATX heading is then the most reliable Markdown signal of intent.
 */
export function titleFromPaste(source: string): string {
  const body = stripFrontMatter(source)
  const m = body.match(/^#{1}\s+(.+?)\s*$/m)
  return m ? m[1].replace(/[#*`_]/g, '').trim() : 'Pasted document'
}
