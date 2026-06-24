import { useContext, useEffect, useRef, useState } from 'react'
import { MermaidThemeContext } from '../lib/theme'

let idCounter = 0

/**
 * Renders a single ```mermaid block to SVG via the imperative v11 API.
 *
 * - `mermaid` is dynamically imported inside the effect, so its ~850KB stays in
 *   a separate chunk loaded only when a document actually contains a diagram.
 * - `mermaid.render` needs a unique id per call (or duplicate-id/stale-SVG
 *   errors appear across re-renders), so we use a module counter.
 * - Theme comes from MermaidThemeContext (not a prop) so toggling light/dark
 *   re-renders ONLY diagrams — never the whole Markdown tree.
 * - Theme is baked into the SVG at render time, so we re-initialize + re-render
 *   whenever it changes.
 * - Errors are caught per-diagram so one malformed block never blanks the doc.
 */
export function MermaidDiagram({ code }: { code: string }) {
  const theme = useContext(MermaidThemeContext)
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setLoading(true)

    ;(async () => {
      try {
        const { default: mermaid } = await import('mermaid')
        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: 'strict',
          flowchart: { useMaxWidth: true, htmlLabels: true },
          themeVariables:
            theme === 'dark'
              ? { background: 'transparent', primaryColor: '#2b2f3a', primaryTextColor: '#e6e6e6' }
              : { background: 'transparent' },
        })
        const id = `mmd-${idCounter++}`
        const { svg, bindFunctions } = await mermaid.render(id, code)
        if (cancelled || !ref.current) return
        ref.current.innerHTML = svg // overwrite, never append (clears stale SVG)
        bindFunctions?.(ref.current) // after insert, so clicks/tooltips work
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [code, theme])

  if (error) {
    return (
      <div
        role="alert"
        className="my-6 rounded-xl border border-red-300/70 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"
      >
        <p className="mb-1 font-semibold">Diagram failed to render</p>
        <pre className="whitespace-pre-wrap break-words font-mono text-xs opacity-80">
          {error}
        </pre>
      </div>
    )
  }

  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-line bg-surface px-4 py-5">
      <div ref={ref} className="[&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full" />
      {loading && (
        <div className="mt-2 text-center font-sans text-sm text-muted">
          Rendering diagram…
        </div>
      )}
    </div>
  )
}
