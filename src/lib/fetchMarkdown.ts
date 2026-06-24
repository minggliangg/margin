export type LoadErrorKind =
  | 'invalid'
  | 'scheme'
  | 'extension'
  | 'network'
  | 'http'
  | 'empty'

export class LoadError extends Error {
  readonly kind: LoadErrorKind
  constructor(message: string, kind: LoadErrorKind) {
    super(message)
    this.name = 'LoadError'
    this.kind = kind
  }
}

const ALLOWED_EXT = ['.md', '.markdown', '.mdown', '.mkd']

/** Convenience: turn a github.com blob URL into a raw, CORS-fetchable one. */
export function rewriteGitHubBlob(url: string): string {
  const m = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/.exec(url)
  if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`
  return url
}

// Exact-host allowlist (not a suffix check) so look-alike domains such as
// `notjsdelivr.net` can't bypass the markdown-extension gate.
const RAW_HOSTS = new Set([
  'raw.githubusercontent.com',
  'gist.githubusercontent.com',
  'cdn.jsdelivr.net',
  'jsdelivr.net',
])

function isRawHost(host: string): boolean {
  return RAW_HOSTS.has(host.toLowerCase())
}

/**
 * Fetch remote Markdown as **raw text** (not HTML). The returned text is fed to
 * the same react-markdown pipeline as uploaded files, which:
 *   - escapes raw HTML (no rehype-raw), and
 *   - sanitizes dangerous URL protocols via react-markdown's default urlTransform,
 * so untrusted remote documents cannot inject scripts. Feature parity (GFM,
 * Shiki, Mermaid, TOC) is preserved for remote docs.
 */
export async function fetchMarkdownText(rawUrl: string): Promise<string> {
  const rewritten = rewriteGitHubBlob(rawUrl.trim())
  const u = URL.parse(rewritten)

  if (!u) throw new LoadError('That doesn’t look like a valid URL.', 'invalid')
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new LoadError('Only http(s) URLs are allowed.', 'scheme')
  }

  const path = u.pathname.toLowerCase()
  const hasMdExt = ALLOWED_EXT.some((ext) => path.endsWith(ext))
  // Some raw hosts serve Markdown without an extension; allow those.
  if (!hasMdExt && !isRawHost(u.hostname)) {
    throw new LoadError(
      'That URL doesn’t look like a Markdown file (.md / .markdown).',
      'extension',
    )
  }

  let res: Response
  try {
    // credentials:'omit' is mandatory — raw.githubusercontent.com sends
    // Access-Control-Allow-Origin: *, which the spec forbids with credentials.
    res = await fetch(u.href, { redirect: 'follow', credentials: 'omit' })
  } catch {
    // CORS / DNS / mixed-content failures throw a TypeError with no response.
    throw new LoadError(
      'Could not reach that URL. The host may not allow browser fetches (CORS). ' +
        'Works best with raw.githubusercontent.com or cdn.jsdelivr.net.',
      'network',
    )
  }

  if (!res.ok) {
    throw new LoadError(
      `The host returned HTTP ${res.status}${res.statusText ? ' ' + res.statusText : ''}.`,
      'http',
    )
  }

  const text = (await res.text()).trim()
  if (!text) throw new LoadError('That file is empty.', 'empty')
  return text
}
