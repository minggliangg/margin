import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Footer } from './components/Footer'
import { Landing } from './components/Landing'
import { TopBar } from './components/TopBar'
import { UploadIcon } from './components/icons'

// The Reader pulls in the whole render pipeline (react-markdown, remark-gfm,
// rehype-slug, Shiki, the TOC) — ~167KB gzip that the landing screen never
// needs. Lazy-loading it keeps the initial bundle to the app shell + Landing,
// so first paint of the landing screen isn't blocked by the Markdown engine.
const Reader = lazy(() =>
  import('./components/Reader').then((m) => ({ default: m.Reader })),
)
import { fetchMarkdownText, LoadError } from './lib/fetchMarkdown'
import { isMarkdownFile, readFileAsText } from './lib/files'
import { stripFrontMatter } from './lib/frontmatter'
import { useDocs } from './lib/storage'
import { useTheme } from './lib/theme'

interface Doc {
  source: string
  title: string
}

type Status = 'idle' | 'loading' | 'error'

function deriveTitle(url: string): string {
  try {
    const u = new URL(url)
    const seg = (u.pathname.split('/').filter(Boolean).pop() ?? '').replace(
      /\.(md|markdown|mdown|mkd)$/i,
      '',
    )
    return seg || u.hostname
  } catch {
    return 'document'
  }
}

/**
 * Title a pasted doc from its first `#`-heading. Front matter is stripped first
 * so a YAML `---` block (which carries no H1) doesn't shadow the real title;
 * an ATX heading is then the most reliable Markdown signal of intent.
 */
function pasteTitle(source: string): string {
  const body = stripFrontMatter(source)
  const m = body.match(/^#{1}\s+(.+?)\s*$/m)
  return m ? m[1].replace(/[#*`_]/g, '').trim() : 'Pasted document'
}

function setUrlParam(url: string) {
  try {
    const u = new URL(window.location.href)
    u.searchParams.set('url', url)
    window.history.replaceState(null, '', u)
  } catch {
    /* ignore */
  }
}

function clearUrlParam() {
  try {
    const u = new URL(window.location.href)
    if (u.searchParams.has('url')) {
      u.searchParams.delete('url')
      window.history.replaceState(null, '', u)
    }
  } catch {
    /* ignore */
  }
}

function hasFiles(e: DragEvent): boolean {
  return Boolean(e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files'))
}

export function App() {
  const { pref, setPref, isDark } = useTheme()
  const { docs, saveDoc, removeDoc } = useDocs()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [urlValue, setUrlValue] = useState('')
  const [pasteValue, setPasteValue] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openPicker = useCallback(() => fileInputRef.current?.click(), [])

  const loadPaste = useCallback((text: string) => {
    const source = text.trim()
    if (!source) return
    setDoc({ source, title: pasteTitle(source) })
    setPasteValue('')
    clearUrlParam()
    setStatus('idle')
    setError(null)
  }, [])

  // A saved doc is local — it has no URL, so opening one clears any ?url= param.
  const openSaved = useCallback((saved: { source: string; title: string }) => {
    setDoc({ source: saved.source, title: saved.title })
    clearUrlParam()
    setStatus('idle')
    setError(null)
    window.scrollTo(0, 0)
  }, [])

  const handleSave = useCallback(() => {
    if (doc) saveDoc({ title: doc.title, source: doc.source })
  }, [doc, saveDoc])

  // A doc is "saved" when its source already exists in the library. Source is the
  // full Markdown text, so it's a reliable fingerprint; a delete flips this back.
  const isSaved = useMemo(
    () => Boolean(doc && docs.some((d) => d.source === doc.source)),
    [doc, docs],
  )

  const loadFile = useCallback(async (file: File) => {
    if (!isMarkdownFile(file)) {
      setError('Please choose a Markdown file (.md / .markdown / .mdown).')
      setStatus('error')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const source = await readFileAsText(file)
      setDoc({ source, title: file.name.replace(/\.(md|markdown|mdown|mkd)$/i, '') })
      clearUrlParam()
      setStatus('idle')
    } catch {
      setError('Could not read that file.')
      setStatus('error')
    }
  }, [])

  const loadUrl = useCallback(async (rawUrl: string) => {
    const url = rawUrl.trim()
    if (!url) return
    setStatus('loading')
    setError(null)
    try {
      const source = await fetchMarkdownText(url)
      setDoc({ source, title: deriveTitle(url) })
      setUrlValue(url)
      setUrlParam(url)
      setStatus('idle')
    } catch (e) {
      setError(e instanceof LoadError ? e.message : 'Something went wrong loading that URL.')
      setStatus('error')
    }
  }, [])

  const loadSample = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample.md`)
      if (!res.ok) throw new Error('sample fetch failed')
      const source = await res.text()
      setDoc({ source, title: 'sample' })
      clearUrlParam()
      setStatus('idle')
    } catch {
      setError('Could not load the sample document.')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setDoc(null)
    setStatus('idle')
    setError(null)
    setUrlValue('')
    clearUrlParam()
    window.scrollTo(0, 0)
  }, [])

  // Open a ?url= passed in the address bar (e.g. shared links) on first load.
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get('url')
    if (url) {
      setUrlValue(url)
      void loadUrl(url)
    }
  }, [loadUrl])

  // Global drag & drop: drop a file anywhere to open it.
  useEffect(() => {
    let depth = 0
    const onEnter = (e: DragEvent) => {
      if (hasFiles(e)) {
        depth++
        setDragging(true)
      }
    }
    const onLeave = () => {
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault()
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDragging(false)
      const file = e.dataTransfer?.files?.[0]
      if (file) void loadFile(file)
    }
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [loadFile])

  // Reflect the loaded document in the browser tab title.
  useEffect(() => {
    document.title = doc ? `${doc.title} · margin.` : 'margin. · a Markdown viewer'
  }, [doc])

  const loading = status === 'loading'

  return (
    <div className="min-h-screen">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.mdown,.mkd,text/markdown,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void loadFile(file)
          e.target.value = ''
        }}
      />

      {doc ? (
        <Suspense fallback={<LoadingView />}>
          <Reader
            source={doc.source}
            title={doc.title}
            pref={pref}
            setPref={setPref}
            isDark={isDark}
            onHome={reset}
            onOpen={openPicker}
            docs={docs}
            onOpenSaved={openSaved}
            onDeleteSaved={removeDoc}
            onSave={handleSave}
            saved={isSaved}
          />
        </Suspense>
      ) : (
        <>
          <TopBar
            showTocButton={false}
            pref={pref}
            setPref={setPref}
            onHome={reset}
            onOpen={openPicker}
            onToggleToc={() => {}}
            docs={docs}
            onOpenSaved={openSaved}
            onDeleteSaved={removeDoc}
          />
          {loading ? (
            <LoadingView />
          ) : (
            <Landing
              onPickFile={openPicker}
              onLoadUrl={loadUrl}
              onLoadSample={loadSample}
              onLoadPaste={loadPaste}
              urlValue={urlValue}
              setUrlValue={setUrlValue}
              pasteValue={pasteValue}
              setPasteValue={setPasteValue}
              error={status === 'error' ? error : null}
            />
          )}
          {/* The signature lives on the landing screen only; reading a doc
              fills the viewport and shouldn't carry chrome below the text. */}
          {!loading && !doc && <Footer />}
        </>
      )}

      {dragging && (
        <div className="animate-fade pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-accent/70 bg-surface px-12 py-10 text-fg">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
              <UploadIcon className="h-7 w-7" />
            </span>
            <p className="font-sans text-lg font-medium">Drop to open</p>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingView() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-16">
      <div className="space-y-4">
        <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
        <div className="mt-8 space-y-3">
          {[100, 95, 88, 92, 70].map((w, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-surface"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
