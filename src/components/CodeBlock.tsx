import type { ComponentPropsWithoutRef } from 'react'
import type { HighlighterCore } from 'shiki'
import { SHIKI_THEMES } from '../lib/highlighter'
import { detectLanguage } from '../lib/detectLang'
import type { CodeBlockData } from '../lib/codeBlock'
import { CodeFrame } from './CodeFrame'
import { MermaidDiagram } from './MermaidDiagram'

interface Props {
  code: CodeBlockData
  highlighter: HighlighterCore | null
  /** The original <pre> props, used for the unhighlighted fallback. */
  preProps: ComponentPropsWithoutRef<'pre'>
}

/** Routes a fenced block: mermaid -> diagram, known lang -> Shiki, else plain. */
export function CodeBlock({ code, highlighter, preProps }: Props) {
  // Mermaid: render as a diagram, isolated from the rest of the document.
  if (code.lang === 'mermaid') return <MermaidDiagram code={code.text} />

  // No declared language: guess one so we can label + highlight it.
  const detected = !code.lang
  const lang = code.lang ?? detectLanguage(code.text)

  const plain = (
    <CodeFrame lang={lang} detected={detected} text={code.text}>
      <pre {...preProps} />
    </CodeFrame>
  )

  // Highlighter not ready yet, or nothing to highlight with: render raw.
  if (!highlighter || !lang) return plain

  try {
    const html = highlighter.codeToHtml(code.text, {
      lang,
      themes: SHIKI_THEMES,
      defaultColor: false, // drive colour from .dark via CSS vars
    })
    return (
      <CodeFrame lang={lang} detected={detected} text={code.text}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </CodeFrame>
    )
  } catch {
    // Unknown / unloaded language -> fall back to plain monospace code.
    return plain
  }
}
