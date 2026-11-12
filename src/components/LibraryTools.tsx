import { useRef, useState } from 'react'
import { downloadBackup, parseBackup } from '../lib/backup'
import type { SavedDoc } from '../lib/storage'
import {
  applyUpdate,
  checkForUpdate,
  CURRENT_BUILD,
  useUpdateState,
} from '../lib/updateCheck'

interface Props {
  docs: SavedDoc[]
  onImport: (docs: SavedDoc[]) => number
}

const btn =
  'h-8 rounded-full border border-line px-3 font-sans text-xs font-medium text-fg transition-colors hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50'

/** Backup/restore for the library, plus a manual app-update check. */
export function LibraryTools({ docs, onImport }: Props) {
  const update = useUpdateState()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function onFile(file: File) {
    const parsed = parseBackup(await file.text())
    if (!parsed) return setMessage('That file is not a margin. backup.')
    const added = onImport(parsed)
    setMessage(added ? `Restored ${added} document${added === 1 ? '' : 's'}.` : 'Nothing new to restore.')
  }

  return (
    <div className="space-y-3 border-t border-line px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} disabled={!docs.length} onClick={() => downloadBackup(docs)}>
          Export backup
        </button>
        <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-sans text-xs text-muted">
        <span aria-live="polite">
          {message ??
            (update === 'checking'
              ? 'Checking for updates…'
              : update === 'current'
                ? 'You’re up to date.'
                : update === 'error'
                  ? 'Couldn’t check for updates.'
                  : update === 'available'
                    ? 'A new version is available.'
                    : `Version ${CURRENT_BUILD}`)}
        </span>
        {update === 'available' ? (
          <button type="button" className={btn} onClick={() => void applyUpdate()}>
            Update now
          </button>
        ) : (
          <button type="button" className={btn} disabled={update === 'checking'} onClick={() => { setMessage(null); void checkForUpdate() }}>
            Check for updates
          </button>
        )}
      </div>
    </div>
  )
}
