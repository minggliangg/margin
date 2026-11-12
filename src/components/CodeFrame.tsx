import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckIcon, CopyIcon } from './icons'
import { langLabel } from '../lib/detectLang'

interface Props {
  lang: string | null
  /** True when `lang` was guessed rather than declared in the fence. */
  detected: boolean
  text: string
  children: ReactNode
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // clipboard API is unavailable on non-secure origins (e.g. plain http over
    // Tailscale), so fall back to a hidden textarea + execCommand.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      ta.remove()
    }
  }
}

export function CodeFrame({ lang, detected, text, children }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function onCopy() {
    if (!(await copyText(text))) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="code-frame">
      <div className="code-frame-bar">
        <span
          className="code-frame-lang"
          title={detected ? 'Language detected automatically' : undefined}
        >
          {lang ? langLabel(lang) : 'Text'}
          {detected && lang ? ' (auto)' : ''}
        </span>
        <button
          type="button"
          className="code-frame-copy"
          onClick={onCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {children}
    </div>
  )
}
