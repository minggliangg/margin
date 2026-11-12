import { isSavedDoc, type SavedDoc } from './storage'

/** Download the library as a JSON file the user can keep and re-import later. */
export function downloadBackup(docs: SavedDoc[]): void {
  const blob = new Blob([JSON.stringify({ app: 'margin', version: 1, docs }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `margin-library-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Parse a backup file; returns null if it isn't one. Malformed records are dropped. */
export function parseBackup(text: string): SavedDoc[] | null {
  try {
    const data: unknown = JSON.parse(text)
    const list = Array.isArray(data) ? data : (data as { docs?: unknown })?.docs
    return Array.isArray(list) ? list.filter(isSavedDoc) : null
  } catch {
    return null
  }
}
