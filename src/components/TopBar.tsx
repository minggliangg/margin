import type { ThemePref } from '../lib/theme'
import type { SavedDoc } from '../lib/storage'
import { Library } from './Library'
import { ThemeToggle } from './ThemeToggle'
import { BookmarkIcon, CheckIcon, ListIcon, UploadIcon } from './icons'

interface Props {
  docTitle?: string
  showTocButton: boolean
  pref: ThemePref
  setPref: (p: ThemePref) => void
  onHome: () => void
  onOpen: () => void
  onToggleToc: () => void
  docs: SavedDoc[]
  onOpenSaved: (doc: SavedDoc) => void
  onDeleteSaved: (id: string) => void
  onSave?: () => void
  saved?: boolean
}

export function TopBar({
  docTitle,
  showTocButton,
  pref,
  setPref,
  onHome,
  onOpen,
  onToggleToc,
  docs,
  onOpenSaved,
  onDeleteSaved,
  onSave,
  saved,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[96rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onHome}
          className="font-serif text-xl font-semibold tracking-tight text-fg"
          aria-label="margin. home"
        >
          margin<span className="text-accent">.</span>
        </button>
        {docTitle && (
          <span className="min-w-0 flex-1 truncate font-sans text-sm text-muted">
            <span className="hidden md:inline">· </span>
            {docTitle}
          </span>
        )}

        <div className={`flex items-center gap-2 ${docTitle ? '' : 'ml-auto'}`}>
          {showTocButton && (
            <button
              type="button"
              onClick={onToggleToc}
              aria-label="Contents"
              title="Contents"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-fg lg:hidden"
            >
              <ListIcon className="h-[18px] w-[18px]" />
            </button>
          )}
          <ThemeToggle pref={pref} setPref={setPref} />
          <Library docs={docs} onOpen={onOpenSaved} onDelete={onDeleteSaved} />
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saved}
              aria-label={saved ? 'Saved to library' : 'Save to library'}
              title={saved ? 'Saved to library' : 'Save to library'}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors hover:border-accent/60 disabled:cursor-default disabled:opacity-60 disabled:hover:border-line"
            >
              {saved ? (
                <CheckIcon className="h-[18px] w-[18px] text-accent" />
              ) : (
                <BookmarkIcon className="h-[18px] w-[18px]" />
              )}
              <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors hover:border-accent/60"
          >
            <UploadIcon className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Open</span>
          </button>
        </div>
      </div>
    </header>
  )
}
