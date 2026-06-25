import { useCallback, useEffect, useState } from 'react'

/**
 * A document saved to the local library. The full Markdown source is stored so
 * a saved doc can be reopened with no network and no backend — the library is
 * entirely client-side and never leaves the browser.
 */
export interface SavedDoc {
  id: string
  title: string
  source: string
  createdAt: number
}

const KEY = 'margin-docs'

/** Cheap, collision-resistant id without pulling in a uuid dependency. */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * Read the library defensively. localStorage may be unavailable (private mode,
 * disabled storage) and JSON may be corrupted or shaped by an older version of
 * this code, so we validate each record and drop anything malformed rather than
 * crashing the app.
 */
function readAll(): SavedDoc[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((d): d is SavedDoc => {
      if (typeof d !== 'object' || d === null) return false
      const o = d as Record<string, unknown>
      return (
        typeof o.id === 'string' &&
        typeof o.title === 'string' &&
        typeof o.source === 'string' &&
        typeof o.createdAt === 'number'
      )
    })
  } catch {
    /* localStorage may be unavailable (private mode) — treat as empty. */
    return []
  }
}

function writeAll(docs: SavedDoc[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(docs))
  } catch {
    /* ignore quota / private-mode write failures — the library stays in-memory. */
  }
}

/**
 * Local document store. Mirrors the pattern in `useTheme`: a defensive reader
 * feeds the initial state, and a write-through effect persists every change.
 *
 * Unlike theme, a library is content the user expects to keep across tabs, so we
 * also listen for the `storage` event — when another tab saves or deletes a doc
 * this tab re-reads from disk and stays in sync.
 */
export function useDocs() {
  const [docs, setDocs] = useState<SavedDoc[]>(readAll)

  useEffect(() => {
    writeAll(docs)
  }, [docs])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setDocs(readAll())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const saveDoc = useCallback((input: { title: string; source: string }) => {
    setDocs((prev) => [{ id: uid(), ...input, createdAt: Date.now() }, ...prev])
  }, [])

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { docs, saveDoc, removeDoc }
}
