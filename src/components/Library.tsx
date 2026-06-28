import { lazy, Suspense, useId, useRef, useState } from 'react'
import type { SavedDoc } from '../lib/storage'
import { LibraryIcon } from './icons'

interface Props {
  docs: SavedDoc[]
  onOpen: (doc: SavedDoc) => void
  onDelete: (id: string) => void
}

// The modal body uses createPortal + a focus trap + a scroll lock — none of
// which the landing screen needs until the dialog is first opened. Splitting it
// out keeps that code (and its react-dom/createPortal wiring) out of the entry
// chunk so it loads on demand, the first time a user opens the Library.
const LibraryModal = lazy(() =>
  import('./LibraryModal').then((m) => ({ default: m.LibraryModal })),
)

export function Library({ docs, onOpen, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const titleId = useId()

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors hover:border-accent/60"
      >
        <LibraryIcon className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">Library</span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <LibraryModal
            docs={docs}
            titleId={titleId}
            onClose={() => setOpen(false)}
            onOpen={(doc) => {
              onOpen(doc)
              setOpen(false)
            }}
            onDelete={onDelete}
            triggerRef={triggerRef}
          />
        </Suspense>
      )}
    </>
  )
}
