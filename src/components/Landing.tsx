import { useId } from 'react'
import { ClipboardIcon, FileTextIcon, LinkIcon, UploadIcon } from './icons'

interface Props {
  onPickFile: () => void
  onLoadUrl: (url: string) => void
  onLoadSample: () => void
  onLoadPaste: (text: string) => void
  urlValue: string
  setUrlValue: (v: string) => void
  pasteValue: string
  setPasteValue: (v: string) => void
  error: string | null
}

export function Landing({
  onPickFile,
  onLoadUrl,
  onLoadSample,
  onLoadPaste,
  urlValue,
  setUrlValue,
  pasteValue,
  setPasteValue,
  error,
}: Props) {
  const urlId = useId()
  const canRender = pasteValue.trim().length > 0

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-3 flex items-center gap-2 font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        a markdown reader
      </div>

      <h1 className="font-serif text-[2.75rem] font-semibold tracking-tight text-fg sm:text-6xl">
        margin<span className="text-accent">.</span>
      </h1>

      <p className="mt-4 max-w-md font-serif text-base leading-relaxed text-muted sm:text-lg">
        Open a Markdown file and read it beautifully. Clean typography,
        diagrams, code, and dark mode — all in your browser. Nothing leaves your
        device.
      </p>

      <button
        type="button"
        onClick={onPickFile}
        className="group mt-8 flex w-full flex-col items-center gap-2.5 rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-8 text-fg transition-colors hover:border-accent/60 hover:bg-surface sm:mt-10 sm:gap-3 sm:py-10"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform group-hover:scale-105">
          <UploadIcon className="h-6 w-6" />
        </span>
        <span className="font-sans text-sm font-medium sm:text-base">
          Choose a Markdown file
        </span>
        <span className="font-sans text-xs text-muted">
          or drag &amp; drop · .md · .markdown · .mdown
        </span>
      </button>

      <div className="my-6 flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="font-sans text-xs uppercase tracking-wider text-muted">
          or open a URL
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onLoadUrl(urlValue)
        }}
        className="flex w-full gap-2"
      >
        <div className="relative flex-1">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            id={urlId}
            type="url"
            inputMode="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://raw.githubusercontent.com/…/README.md"
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 font-sans text-sm text-fg placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-accent px-5 font-sans text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
        >
          Open
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 max-w-md rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-left font-sans text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          {error}
        </p>
      )}

      <div className="my-6 flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="font-sans text-xs uppercase tracking-wider text-muted">
          or paste markdown
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canRender) onLoadPaste(pasteValue)
        }}
        className="w-full"
      >
        <div className="relative">
          <ClipboardIcon className="pointer-events-none absolute left-3 top-3 h-[18px] w-[18px] text-muted" />
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder={'# Title\n\nPaste raw Markdown here, then render it.'}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-2xl border border-line bg-surface py-3 pl-10 pr-4 font-mono text-sm leading-relaxed text-fg placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!canRender}
          className="mt-3 h-11 shrink-0 rounded-full bg-accent px-5 font-sans text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
        >
          Render
        </button>
      </form>

      <button
        type="button"
        onClick={onLoadSample}
        className="mt-8 inline-flex items-center gap-2 font-sans text-sm text-muted transition-colors hover:text-fg"
      >
        <FileTextIcon className="h-[18px] w-[18px]" />
        or try a sample document
      </button>
    </main>
  )
}
