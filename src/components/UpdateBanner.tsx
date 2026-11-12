import { applyUpdate, useUpdateState } from '../lib/updateCheck'

export function UpdateBanner() {
  if (useUpdateState() !== 'available') return null
  return (
    <div className="animate-slide-up fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 font-sans text-sm text-fg shadow-lg shadow-black/10">
        <span>A new version is available</span>
        <button
          type="button"
          onClick={() => void applyUpdate()}
          className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
        >
          Update
        </button>
      </div>
    </div>
  )
}
