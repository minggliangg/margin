import { useCallback, useRef, useState } from 'react'
import type { ThemePref } from '../lib/theme'
import type { SavedDoc } from '../lib/storage'
import { mermaidTheme, MermaidThemeContext } from '../lib/theme'
import { useActiveHeading, useTableOfContents } from '../lib/toc'
import { Markdown } from './Markdown'
import { TableOfContents } from './TableOfContents'
import { TopBar } from './TopBar'

interface Props {
  source: string
  title?: string
  pref: ThemePref
  setPref: (p: ThemePref) => void
  isDark: boolean
  onHome: () => void
  onOpen: () => void
  docs: SavedDoc[]
  onOpenSaved: (doc: SavedDoc) => void
  onDeleteSaved: (id: string) => void
  onSave: () => void
  saved: boolean
}

export function Reader({
  source,
  title,
  pref,
  setPref,
  isDark,
  onHome,
  onOpen,
  docs,
  onOpenSaved,
  onDeleteSaved,
  onSave,
  saved,
}: Props) {
  const articleRef = useRef<HTMLElement>(null)
  const [docVersion, setDocVersion] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)

  const onContentRendered = useCallback(() => setDocVersion((v) => v + 1), [])

  const items = useTableOfContents(articleRef, docVersion)
  const activeId = useActiveHeading(items.map((i) => i.id))

  return (
    <>
      <TopBar
        docTitle={title}
        showTocButton={items.length > 0}
        pref={pref}
        setPref={setPref}
        onHome={onHome}
        onOpen={onOpen}
        onToggleToc={() => setTocOpen(true)}
        docs={docs}
        onOpenSaved={onOpenSaved}
        onDeleteSaved={onDeleteSaved}
        onSave={onSave}
        saved={saved}
      />

      {/* Mermaid reads the theme from context so a theme toggle re-renders only
          diagrams, not the whole (memoized) Markdown tree. */}
      <MermaidThemeContext.Provider value={mermaidTheme(isDark)}>
        <div className="mx-auto flex w-full max-w-[96rem] gap-10 px-4 sm:px-6 lg:px-8">
          <TableOfContents
            items={items}
            activeId={activeId}
            open={tocOpen}
            onClose={() => setTocOpen(false)}
          />

          <main className="min-w-0 flex-1 overflow-x-clip pb-24">
            <article ref={articleRef} className="mx-auto max-w-[68ch] py-10 lg:py-14">
              <Markdown source={source} onContentRendered={onContentRendered} />
            </article>
          </main>
        </div>
      </MermaidThemeContext.Provider>
    </>
  )
}
