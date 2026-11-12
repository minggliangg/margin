import { lazy, Suspense, useCallback, useMemo, useRef } from 'react'
import { DropOverlay } from './components/DropOverlay'
import { Footer } from './components/Footer'
import { Landing } from './components/Landing'
import { LoadingView } from './components/LoadingView'
import { TopBar } from './components/TopBar'
import { UpdateBanner } from './components/UpdateBanner'
import { useDocument } from './hooks/useDocument'
import { useAutoUpdateCheck } from './hooks/useAutoUpdateCheck'
import { useFileDrop } from './hooks/useFileDrop'
import { useDocs } from './lib/storage'
import { useTheme } from './lib/theme'

// The Reader pulls in the whole render pipeline (react-markdown, remark-gfm,
// rehype-slug, Shiki, the TOC) — ~167KB gzip that the landing screen never
// needs. Lazy-loading it keeps the initial bundle to the app shell + Landing,
// so first paint of the landing screen isn't blocked by the Markdown engine.
const Reader = lazy(() =>
  import('./components/Reader').then((m) => ({ default: m.Reader })),
)

export function App() {
  useAutoUpdateCheck()
  const { pref, setPref, isDark } = useTheme()
  const { docs, saveDoc, removeDoc, importDocs } = useDocs()
  const {
    doc,
    status,
    error,
    urlValue,
    setUrlValue,
    pasteValue,
    setPasteValue,
    loadFile,
    loadUrl,
    loadSample,
    loadPaste,
    openSaved,
    reset,
  } = useDocument()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const openPicker = useCallback(() => fileInputRef.current?.click(), [])
  const dragging = useFileDrop(loadFile)

  const handleSave = useCallback(() => {
    if (doc) saveDoc({ title: doc.title, source: doc.source })
  }, [doc, saveDoc])

  // A doc is "saved" when its source already exists in the library. Source is the
  // full Markdown text, so it's a reliable fingerprint; a delete flips this back.
  const isSaved = useMemo(
    () => Boolean(doc && docs.some((d) => d.source === doc.source)),
    [doc, docs],
  )

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
            onImportSaved={importDocs}
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
            onImportSaved={importDocs}
          />
          {loading ? (
            <LoadingView />
          ) : (
            <>
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
              {/* The signature lives on the landing screen only; reading a doc
                  fills the viewport and shouldn't carry chrome below the text. */}
              <Footer />
            </>
          )}
        </>
      )}

      {dragging && <DropOverlay />}
      <UpdateBanner />
    </div>
  )
}
