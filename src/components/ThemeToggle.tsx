import { useEffect, useRef, useState } from 'react'
import type { ThemePref } from '../lib/theme'
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from './icons'

const OPTIONS: { value: ThemePref; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
]

export function ThemeToggle({
  pref,
  setPref,
}: {
  pref: ThemePref
  setPref: (p: ThemePref) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const active = OPTIONS.find((o) => o.value === pref) ?? OPTIONS[2]
  const { Icon: ActiveIcon } = active

  // Click-outside + Escape to dismiss; return focus to the trigger.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Theme: ${active.label}. Change theme`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-fg"
      >
        <ActiveIcon className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="animate-fade absolute right-0 top-11 z-50 w-36 overflow-hidden rounded-2xl border border-line bg-canvas p-1 shadow-lg shadow-black/5"
        >
          {OPTIONS.map(({ value, label, Icon }) => {
            const selected = value === pref
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setPref(value)
                  setOpen(false)
                }}
                className={[
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-sans text-sm transition-colors',
                  selected
                    ? 'bg-accent-soft text-fg'
                    : 'text-muted hover:bg-surface hover:text-fg',
                ].join(' ')}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">{label}</span>
                {selected && <CheckIcon className="h-4 w-4 text-accent" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
