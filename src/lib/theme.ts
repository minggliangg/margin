import { createContext, useCallback, useEffect, useState } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

/** Effective Mermaid theme, provided via context so a theme toggle re-renders
 *  only Mermaid diagrams (Shiki colour is CSS-driven and never re-highlights). */
export const MermaidThemeContext = createContext<'default' | 'dark'>('default')

const KEY = 'margin-theme'

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* localStorage may be unavailable (private mode) */
  }
  return 'system'
}

/**
 * Theme system with no flash: the inline script in index.html sets `.dark`
 * before paint; this hook keeps React in sync, persists the choice, and reacts
 * to OS preference changes while in `system` mode.
 *
 * Returns the preference, a setter, and the resolved effective booleans so
 * children (e.g. Mermaid) can re-render when the effective theme changes.
 */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref)
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches,
  )

  const isDark = pref === 'dark' || (pref === 'system' && systemDark)

  const apply = useCallback((dark: boolean) => {
    const el = document.documentElement
    el.classList.toggle('dark', dark)
    el.style.colorScheme = dark ? 'dark' : 'light'
  }, [])

  useEffect(() => {
    apply(isDark)
  }, [isDark, apply])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, pref)
    } catch {
      /* ignore */
    }
  }, [pref])

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return { pref, setPref, isDark }
}

/** Mermaid takes 'default' | 'dark' | 'forest' | 'neutral'. */
export function mermaidTheme(isDark: boolean): 'default' | 'dark' {
  return isDark ? 'dark' : 'default'
}
