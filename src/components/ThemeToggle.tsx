import type { ThemePref } from '../lib/theme'
import { MonitorIcon, MoonIcon, SunIcon } from './icons'

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
  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = pref === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPref(value)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              active
                ? 'bg-accent text-canvas'
                : 'text-muted hover:text-fg',
            ].join(' ')}
          >
            <Icon className="h-[18px] w-[18px]" />
          </button>
        )
      })}
    </div>
  )
}
