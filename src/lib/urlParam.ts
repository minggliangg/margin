/** The `?url=` query param that makes a loaded remote doc shareable. */

export function getUrlParam(): string | null {
  return new URLSearchParams(window.location.search).get('url')
}

export function setUrlParam(url: string) {
  try {
    const u = new URL(window.location.href)
    u.searchParams.set('url', url)
    window.history.replaceState(null, '', u)
  } catch {
    /* ignore */
  }
}

export function clearUrlParam() {
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
