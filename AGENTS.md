# AGENTS.md

Guidance for AI agents working in this repo. Read this before editing.

## What this is

`margin.` — a lightweight, **client-side** Markdown viewer. Upload a `.md` file or
open one by `?url=`; it renders with clean typography, Shiki code highlighting,
Mermaid diagrams, an auto TOC, and a light/dark theme. **There is no backend** —
nothing a user opens ever leaves the browser.

Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS v4. Package manager is **bun**
(there is a `bun.lock`; do not introduce npm/yarn/pnpm lockfiles).

## Commands

```sh
bun install
bun run dev          # vite --host → http://localhost:5173, binds all interfaces
bun run build        # tsc -b && vite build, then postbuild copies dist/404.html
bun run preview      # serve the dist/ bundle
bun run typecheck    # tsc -b --noEmit  (the only quality gate — there is no test/lint script)
```

`typecheck` is the gate. There are **no unit tests and no linter** configured; if
you add code, make sure `bun run typecheck` passes and `bun run build` succeeds.

## Project layout

```
index.html              # shell: no-flash theme script + GitHub Pages 404-redirect script
src/main.tsx            # entry: restores deep-link from sessionStorage, mounts <App/>
src/App.tsx             # top-level state machine (idle/loading/error), load routing, drag&drop
src/components/
  Markdown.tsx          # react-markdown pipeline + code-block routing (the core)
  MermaidDiagram.tsx    # isolated, lazy Mermaid renderer
  Reader.tsx            # TopBar + TableOfContents + Markdown composition
  TableOfContents.tsx, TopBar.tsx, ThemeToggle.tsx, Landing.tsx, icons.tsx
src/lib/
  fetchMarkdown.ts      # remote ?url= fetch + validation + LoadError
  frontmatter.ts        # strips leading YAML/TOML front matter before render
  highlighter.ts        # Shiki core + explicit lang/theme modules (no WASM)
  theme.ts              # useTheme() hook, MermaidThemeContext
  toc.ts                # TOC extraction + scroll-spy hooks
  files.ts              # isMarkdownFile / readFileAsText
  storage.ts            # useDocs() — localStorage doc store (saved-doc library)
scripts/copy-404.mjs    # postbuild: dist/index.html → dist/404.html (SPA fallback)
vite.config.ts          # base from VITE_BASE (absolute, required for code-split chunks)
.github/workflows/deploy.yml
```

## Architecture / data flow

1. `main.tsx` restores a deep-link saved by the `404.html` redirect, then mounts `<App/>`.
2. `App.tsx` holds the loaded `Doc` and a `Status` (`idle|loading|error`). Three load
   paths, all producing raw Markdown text: **file upload** (global drag&drop or picker),
   **`?url=`** (reflected into the address bar), and the bundled **sample**.
3. When a doc is loaded it renders `<Reader/>`; otherwise `<Landing/>`.
4. `Markdown.tsx` runs the pipeline: `stripFrontMatter` → `react-markdown` with
   `remark-gfm` + `rehype-slug` → per-element `components`. `<pre>` blocks are routed:
   `mermaid` → `<MermaidDiagram/>`, a known language → Shiki, otherwise a plain `<pre>`.
5. Theme is class-based: `.dark` on `<html>`, set by `useTheme()` and persisted to
   `localStorage` under `margin-theme`. An inline script in `index.html` applies it
   before paint (no flash). Effective theme is also pushed through `MermaidThemeContext`
   so a toggle re-renders **only** Mermaid diagrams, not the memoized Markdown tree.

## Key invariants — do not break these

- **Safe-by-default rendering.** Raw HTML is escaped — there is deliberately **no
  `rehype-raw`**. Remote documents go through the same pipeline as uploads. Do not add
  `rehype-raw` or any plugin that injects unescaped HTML.
- **Remote fetch is fenced.** `fetchMarkdownText` allows only `http(s):`, requires a
  Markdown extension (`.md/.markdown/.mdown/.mkd`) **or** an exact-host allowlist
  (`raw.githubusercontent.com`, `gist.githubusercontent.com`, `cdn.jsdelivr.net`,
  `jsdelivr.net` — a `Set`, not a suffix check), rewrites `github.com/.../blob/...` →
  raw, and fetches with `credentials: 'omit'`. Preserve all of this.
- **`VITE_BASE` must stay absolute.** `vite.config.ts` uses `process.env.VITE_BASE ?? '/'`.
  Relative `./` breaks code-split chunks (Shiki/Mermaid) on GitHub Pages — see vitejs/vite#11804.
- **Front matter is metadata, not content.** `stripFrontMatter` only matches a block at
  offset 0 (`---`/`+++`). Don't "simplify" it to strip mid-body `---` (thematic breaks / Marp slides).
- **Shiki uses `shiki/core` + the JS regex engine** (no Oniguruma WASM) and only the
  languages explicitly imported in `highlighter.ts`. Highlighting is done inside the
  `pre` component (not a rehype plugin) so an unknown language falls back to plain code
  instead of crashing the document. Colour is CSS-driven (`defaultColor: false`); never
  re-highlight on theme change.
- **`dist/404.html` is the SPA fallback** for GitHub Pages. `scripts/copy-404.mjs` runs
  in `postbuild`; the redirect dance lives in `index.html` + `main.tsx` (sessionStorage
  key `m:redirect`).

## Conventions

- **TypeScript is strict** (`tsconfig.app.json`): `strict`, `noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`. The last
  one means **use `import type` for type-only imports** (types, interfaces, `Components`, etc.).
- **Comments explain *why*, not *what*.** Existing code is prose-heavy around non-obvious
  decisions (security, the 404 redirect, Shiki core). Match that density; don't add noise.
- **localStorage/sessionStorage calls are wrapped in try/catch** — private-mode browsers
  throw. Keep that pattern (see `theme.ts`, `storage.ts`). Keys in use:
  `margin-theme`, `margin-docs`.
- **Components are small and composable;** memoize expensive trees (`Markdown` is `memo`'d)
  so a theme toggle doesn't re-parse the document.
- Mobile-first: the TOC is a sticky sidebar on desktop and a bottom sheet on mobile.

## Note on `src/lib/storage.ts`

`useDocs()` is the local document store: interface `SavedDoc` persisted to
`localStorage` key `margin-docs`. It backs the saved-document **Library** (top-bar
modal in `Library.tsx`, surfaced via `TopBar` on both the landing screen and while
reading). `App.tsx` owns the single `useDocs()` instance and passes `docs` /
`onOpenSaved` / `onDeleteSaved` down through `Reader`/`TopBar`; `onSave` is passed
only while reading. The store is write-through and listens for the `storage` event so
saves/deletes sync across tabs. As always, every `localStorage` call is in try/catch.

## Deploy

Static-only, via GitHub Actions on push to `main` (`.github/workflows/deploy.yml`).
CI builds with `VITE_BASE=/margin/` (project page → `https://minggliangg.github.io/margin/`)
using `bun install --frozen-lockfile`, uploads `dist/`, and deploys to GitHub Pages.
Actions are pinned to Node 24. Do not commit changes to `dist/` (it's gitignored).
