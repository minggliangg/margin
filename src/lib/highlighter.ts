import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

/**
 * Fine-grained Shiki highlighter via `shiki/core` + explicit language/theme
 * modules. Using the core entry (instead of the `shiki` main entry) means only
 * the languages below are bundled — the main entry otherwise drags in the full
 * grammar registry as hundreds of dead chunks. The JS regex engine removes the
 * Oniguruma WASM dependency entirely (ideal for a static deploy).
 */
export const highlighterPromise = createHighlighterCore({
  themes: [
    import('@shikijs/themes/github-light'),
    import('@shikijs/themes/github-dark'),
  ],
  langs: [
    import('@shikijs/langs/javascript'),
    import('@shikijs/langs/typescript'),
    import('@shikijs/langs/tsx'),
    import('@shikijs/langs/jsx'),
    import('@shikijs/langs/json'),
    import('@shikijs/langs/css'),
    import('@shikijs/langs/html'),
    import('@shikijs/langs/markdown'),
    import('@shikijs/langs/bash'),
    import('@shikijs/langs/shellscript'),
    import('@shikijs/langs/yaml'),
    import('@shikijs/langs/toml'),
    import('@shikijs/langs/python'),
    import('@shikijs/langs/go'),
    import('@shikijs/langs/rust'),
    import('@shikijs/langs/java'),
    import('@shikijs/langs/sql'),
    import('@shikijs/langs/diff'),
    import('@shikijs/langs/dockerfile'),
  ],
  engine: createJavaScriptRegexEngine(),
})

export const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const
