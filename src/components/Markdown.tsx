import type { ReactNode } from 'react'
import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import type { HighlighterCore } from 'shiki'
import { highlighterPromise } from '../lib/highlighter'
import { codeFromPre } from '../lib/codeBlock'
import { stripFrontMatter } from '../lib/frontmatter'
import { CodeBlock } from './CodeBlock'

interface Props {
  source: string
  /** Bumped into a doc-version counter by the parent so TOC/scroll-spy re-run. */
  onContentRendered?: () => void
}

/** h2–h4 with a hover-revealed anchor link for sharing a section. */
function Heading({
  level,
  id,
  children,
}: {
  level: 2 | 3 | 4
  id?: string
  children?: ReactNode
}) {
  const Tag = `h${level}` as const
  return (
    <Tag id={id}>
      {children}
      {id && (
        <a className="anchor" href={`#${id}`} aria-label="Link to this section">
          #
        </a>
      )}
    </Tag>
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
        return <CodeBlock code={code} highlighter={highlighter} preProps={rest} />
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
      h2: (p) => <Heading level={2} {...p} />,
      h3: (p) => <Heading level={3} {...p} />,
      h4: (p) => <Heading level={4} {...p} />,
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
