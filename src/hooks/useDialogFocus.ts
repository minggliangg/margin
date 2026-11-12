import { useEffect } from 'react'
import type { RefObject } from 'react'

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(
    el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((e) => e.offsetParent !== null)
}

interface Options {
  /** Whether the dialog is currently open. */
  active: boolean
  panelRef: RefObject<HTMLElement | null>
  onClose: () => void
  /** Where focus returns on close. Defaults to whatever was focused on open. */
  returnFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Modal a11y shared by the TOC sheet and the library dialog: focus the first
 * control, trap Tab, close on Escape, lock body scroll, and restore focus.
 */
export function useDialogFocus({ active, panelRef, onClose, returnFocusRef }: Options) {
  useEffect(() => {
    if (!active) return

    const opener = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (panel) getFocusable(panel)[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && panel) {
        const f = getFocusable(panel)
        if (f.length === 0) return
        const first = f[0]
        const last = f[f.length - 1]
        const current = document.activeElement as HTMLElement | null
        if (e.shiftKey && current === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && current === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      ;(returnFocusRef?.current ?? opener)?.focus?.()
    }
  }, [active, panelRef, onClose, returnFocusRef])
}
