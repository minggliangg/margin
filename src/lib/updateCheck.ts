import { useSyncExternalStore } from 'react'

export type UpdateState = 'idle' | 'checking' | 'available' | 'current' | 'error'

/**
 * Module-level store so the banner and the Library dialog share one result
 * without prop-drilling. State is only a status string; saved docs live in
 * localStorage and survive the reload that applies an update.
 */
let state: UpdateState = 'idle'
const listeners = new Set<() => void>()

function set(next: UpdateState) {
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
}

export const CURRENT_BUILD = __BUILD_ID__

export async function checkForUpdate(): Promise<void> {
  if (import.meta.env.DEV) return set('current') // no version.json in dev
  set('checking')
  try {
    // no-store + a cache-busting query: installed iOS web apps cache aggressively.
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(String(res.status))
    const { id } = (await res.json()) as { id?: string }
    set(id && id !== CURRENT_BUILD ? 'available' : 'current')
  } catch {
    set('error')
  }
}

/** Fetch a fresh index.html past any HTTP cache, then reload onto it. */
export async function applyUpdate(): Promise<void> {
  try {
    await fetch(window.location.pathname, { cache: 'reload' })
  } catch {
    /* offline: reload anyway */
  }
  window.location.reload()
}

export function useUpdateState(): UpdateState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}
