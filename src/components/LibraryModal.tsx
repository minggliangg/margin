import { useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { SavedDoc } from '../lib/storage'
import { LibraryTools } from './LibraryTools'
import { useDialogFocus } from '../hooks/useDialogFocus'
import { CloseIcon, FileTextIcon, TrashIcon } from './icons'

interface Props {
  docs: SavedDoc[]
  titleId: string
  onClose: () => void
  onOpen: (doc: SavedDoc) => void
  onDelete: (id: string) => void
  onImport: (docs: SavedDoc[]) => number
  // Focus is restored to the trigger button on close. RefObject (not a plain
  // ref callback) so this lazy modal doesn't need to know about the button's
  // lifecycle — the eager Library owns it and hands it down.
  triggerRef: RefObject<HTMLButtonElement | null>
}

export function LibraryModal({
  docs,
  titleId,
  onClose,
  onOpen,
  onDelete,
  onImport,
  triggerRef,
}: Props) {
  // Two-step delete: first click arms a row, second click confirms. Avoids a
  // blocking `window.confirm` while still guarding against accidental deletion.
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus trap, Escape, scroll lock; focus returns to the trigger on close.
  useDialogFocus({ active: true, panelRef, onClose, returnFocusRef: triggerRef })

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="animate-fade flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-xl shadow-black/10"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2
              id={titleId}
              className="font-sans text-sm font-semibold uppercase tracking-wider text-muted"
            >
              Library
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close library"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-fg"
            >
              <CloseIcon />
            </button>
          </div>

          {docs.length === 0 ? (
            <p className="px-5 py-10 text-center font-sans text-sm text-muted">
              No saved documents yet.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-y-auto">
              {docs.map((doc) => {
                const confirming = confirmingId === doc.id
                return (
                  <li key={doc.id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                    <button
                      type="button"
                      onClick={() => onOpen(doc)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:text-accent"
                      title={`Open ${doc.title}`}
                    >
                      <FileTextIcon className="h-5 w-5 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sans text-sm font-medium text-fg">
                          {doc.title}
                        </span>
                        <span className="block font-sans text-xs text-muted">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </button>

                    {confirming ? (
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(doc.id)
                            setConfirmingId(null)
                          }}
                          className="h-8 rounded-full bg-red-600 px-3 font-sans text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          aria-label="Cancel delete"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-fg"
                        >
                          <CloseIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(doc.id)}
                        aria-label={`Delete ${doc.title}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        <TrashIcon className="h-[18px] w-[18px]" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <LibraryTools docs={docs} onImport={onImport} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
