import { useCallback, useEffect, useState } from 'react'
import { fetchMarkdownText, LoadError } from '../lib/fetchMarkdown'
import { isMarkdownFile, readFileAsText } from '../lib/files'
import { titleFromFile, titleFromPaste, titleFromUrl } from '../lib/docTitle'
import { clearUrlParam, getUrlParam, setUrlParam } from '../lib/urlParam'

export interface Doc {
  source: string
  title: string
}

export type Status = 'idle' | 'loading' | 'error'

/**
 * Owns "what document is open and how did we get it": the current doc, load
 * status/error, and the landing-screen inputs. Every loader (file, URL, paste,
 * sample, saved) funnels through here so URL-param sync lives in one place.
 */
export function useDocument() {
  const [doc, setDoc] = useState<Doc | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [urlValue, setUrlValue] = useState('')
  const [pasteValue, setPasteValue] = useState('')

  const fail = useCallback((message: string) => {
    setError(message)
    setStatus('error')
  }, [])

  const begin = useCallback(() => {
    setStatus('loading')
    setError(null)
  }, [])

  /** Show a local (non-URL) doc: no `?url=` to reflect, so clear any stale one. */
  const showLocal = useCallback((next: Doc) => {
    setDoc(next)
    clearUrlParam()
    setStatus('idle')
    setError(null)
  }, [])

  const loadPaste = useCallback(
    (text: string) => {
      const source = text.trim()
      if (!source) return
      showLocal({ source, title: titleFromPaste(source) })
      setPasteValue('')
    },
    [showLocal],
  )

  const openSaved = useCallback(
    (saved: Doc) => {
      showLocal({ source: saved.source, title: saved.title })
      window.scrollTo(0, 0)
    },
    [showLocal],
  )

  const loadFile = useCallback(
    async (file: File) => {
      if (!isMarkdownFile(file)) {
        fail('Please choose a Markdown file (.md / .markdown / .mdown).')
        return
      }
      begin()
      try {
        showLocal({ source: await readFileAsText(file), title: titleFromFile(file) })
      } catch {
        fail('Could not read that file.')
      }
    },
    [begin, fail, showLocal],
  )

  const loadUrl = useCallback(
    async (rawUrl: string) => {
      const url = rawUrl.trim()
      if (!url) return
      begin()
      try {
        const source = await fetchMarkdownText(url)
        setDoc({ source, title: titleFromUrl(url) })
        setUrlValue(url)
        setUrlParam(url)
        setStatus('idle')
      } catch (e) {
        fail(e instanceof LoadError ? e.message : 'Something went wrong loading that URL.')
      }
    },
    [begin, fail],
  )

  const loadSample = useCallback(async () => {
    begin()
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample.md`)
      if (!res.ok) throw new Error('sample fetch failed')
      showLocal({ source: await res.text(), title: 'sample' })
    } catch {
      fail('Could not load the sample document.')
    }
  }, [begin, fail, showLocal])

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
    const url = getUrlParam()
    if (url) {
      setUrlValue(url)
      void loadUrl(url)
    }
  }, [loadUrl])

  // Reflect the loaded document in the browser tab title.
  useEffect(() => {
    document.title = doc ? `${doc.title} · margin.` : 'margin. · a Markdown viewer'
  }, [doc])

  return {
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
  }
}
