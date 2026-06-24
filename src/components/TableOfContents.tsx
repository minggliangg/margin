import { useEffect, useRef } from 'react'
import type { TocItem } from '../lib/toc'
import { CloseIcon } from './icons'

interface Props {
  items: TocItem[]
  activeId: string | null
  open: boolean
  onClose: () => void
}

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(
    el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((e) => e.offsetParent !== null)
}

function TocList({
  items,
  activeId,
  onNavigate,
}: {
  items: TocItem[]
  activeId: string | null
  onNavigate?: () => void
}) {
  return (
    <nav className="text-sm" aria-label="Table of contents">
      <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
        Contents
      </p>
      <ul className="space-y-0.5 border-l border-line">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={onNavigate}
                style={{ paddingLeft: (item.level - 2) * 12 + 12 }}
                className={[
                  '-ml-px block truncate border-l-2 py-1.5 pr-2 transition-colors',
                  active
                    ? 'border-accent font-medium text-fg'
                    : 'border-transparent text-muted hover:border-line hover:text-fg',
                ].join(' ')}
                title={item.text}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function TableOfContents({ items, activeId, open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Focus management + Tab trap + body scroll lock while the mobile sheet is
  // open; restore focus to the trigger button on close.
  useEffect(() => {
    if (!open) return

    triggerRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = panel ? getFocusable(panel) : []
    focusables[0]?.focus()

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
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
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
      triggerRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!items.length) return null

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 pb-10">
          <TocList items={items} activeId={activeId} />
        </div>
      </aside>

      {/* Mobile bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Table of contents"
            className="animate-slide-up absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-line bg-canvas p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted">
                Contents
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close contents"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-fg"
              >
                <CloseIcon />
              </button>
            </div>
            <TocList items={items} activeId={activeId} onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  )
}
