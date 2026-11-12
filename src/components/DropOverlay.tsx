import { UploadIcon } from './icons'

export function DropOverlay() {
  return (
    <div className="animate-fade pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-accent/70 bg-surface px-12 py-10 text-fg">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <UploadIcon className="h-7 w-7" />
        </span>
        <p className="font-sans text-lg font-medium">Drop to open</p>
      </div>
    </div>
  )
}
