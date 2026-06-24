import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import type { HighlighterCore } from 'shiki'
import { highlighterPromise, SHIKI_THEMES } from '../lib/highlighter'
import { stripFrontMatter } from '../lib/frontmatter'
import { MermaidDiagram } from './MermaidDiagram'

interface Props {
  source: string
  /** Bumped into a doc-version counter by the parent so TOC/scroll-spy re-run. */
  onContentRendered?: () => void
}

interface CodeBlock {
  lang: string | null
  text: string
}

/**
 * Extract `{ lang, text }` from a <pre><code> HAST node produced by react-markdown.
 * Used to route the block: mermaid -> diagram, known lang -> Shiki, else plain.
 */
function codeFromPre(node: unknown): CodeBlock | null {
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

function Anchor({ id }: { id?: string }) {
  if (!id) return null
  return (
    <a className="anchor" href={`#${id}`} aria-label="Link to this section">
      #
    </a>
  )
}

/**
 * Memoized so a theme toggle (which only affects Mermaid via context) does NOT
 * re-parse the document or re-run Shiki — Shiki colour is driven purely by CSS.
 */
export const Markdown = memo(function Markdown({ source, onContentRendered }: Props) {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null)

  // Strip YAML/TOML front matter (Marp, Jekyll, Hugo, …) before rendering: it's
  // document metadata, and a leading `---` block otherwise renders as a tangle
  // of horizontal rules + broken paragraphs.
  const body = useMemo(() => stripFrontMatter(source), [source])

  useEffect(() => {
    let alive = true
    highlighterPromise.then((hl) => {
      if (alive) setHighlighter(hl)
    })
    return () => {
      alive = false
    }
  }, [])

  // rehype-slug gives headings stable, GitHub-style IDs for TOC + anchors.
  // Highlighting is done in the `pre` component (not a rehype plugin) so a
  // failing/unknown language can never crash the whole document render.
  const rehypePlugins = useMemo(() => [rehypeSlug], [])

  // Notify the parent after the (possibly async) content commits to the DOM.
  useLayoutEffect(() => {
    onContentRendered?.()
  }, [body, highlighter, onContentRendered])

  const components = useMemo<Components>(
    () => ({
      pre({ node, ...rest }) {
        const code = codeFromPre(node)
        if (!code) return <pre {...rest} />

        // Mermaid: render as a diagram, isolated from the rest of the document.
        if (code.lang === 'mermaid') {
          return <MermaidDiagram code={code.text} />
        }

        // Plain fence, or the highlighter hasn't resolved yet: render raw.
        if (!highlighter || !code.lang) return <pre {...rest} />

        try {
          const html = highlighter.codeToHtml(code.text, {
            lang: code.lang,
            themes: SHIKI_THEMES,
            defaultColor: false, // drive colour from .dark via CSS vars
          })
          return <div dangerouslySetInnerHTML={{ __html: html }} />
        } catch {
          // Unknown / unloaded language -> fall back to plain monospace code.
          return <pre {...rest} />
        }
      },
      a({ href, title, children }) {
        return (
          <a href={href} title={title} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      },
      img({ src, alt, title }) {
        return <img src={src} alt={alt ?? ''} title={title} loading="lazy" />
      },
      table({ children }) {
        return (
          <div className="overflow-x-auto">
            <table>{children}</table>
          </div>
        )
      },
      h2({ id, children }) {
        return (
          <h2 id={id}>
            {children}
            <Anchor id={id} />
          </h2>
        )
      },
      h3({ id, children }) {
        return (
          <h3 id={id}>
            {children}
            <Anchor id={id} />
          </h3>
        )
      },
      h4({ id, children }) {
        return (
          <h4 id={id}>
            {children}
            <Anchor id={id} />
          </h4>
        )
      },
    }),
    [highlighter],
  )

  return (
    <div className="reader animate-in">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
})
