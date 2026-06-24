# margin.

A lightweight, **client-side** Markdown viewer. Drop in a `.md` file (or open one
by URL) and read it beautifully — clean typography, syntax-highlighted code,
Mermaid diagrams, a generated table of contents, and a calm light/dark theme.
**Nothing you open ever leaves your device** — there is no backend.

Built with React + TypeScript + Vite + Tailwind CSS v4. Packages managed with **bun**.

## Develop

```sh
bun install
bun run dev        # serves on http://localhost:5173 and binds to all interfaces
```

`bun run dev` uses `vite --host`, so it is reachable from any device on your
network — including Tailscale.

### Open it from your phone over Tailscale

```sh
tailscale ip -4                      # e.g. 100.80.70.9
# then on your phone (on the same tailnet):
#   http://100.80.70.9:5173
```

For a tidy HTTPS URL instead of an IP:port:

```sh
sudo tailscale serve --bg --https=5173 http://localhost:5173
```

## Build & preview the production bundle

```sh
bun run build       # tsc + vite build → dist/  (also writes dist/404.html)
bun run preview     # serve dist/ locally
```

## Deploy to GitHub Pages

Static-only, no backend. Set the deploy path at build time:

- **Project page** (`https://USER.github.io/REPO/`): `VITE_BASE=/REPO/ bun run build`
- **User/org page** (`https://USER.github.io/`): `VITE_BASE=/ bun run build` (or unset)

`dist/404.html` (a copy of `index.html`) provides the SPA fallback so deep links
and `?url=` shares survive a hard refresh. Upload the `dist/` artifact via GitHub
Actions (Settings → Pages → Source = GitHub Actions).

## Opening documents

- **Upload** — drag & drop a `.md`/`.markdown`/`.mdown` file anywhere, or use the
  picker / the top-bar **Open** button.
- **URL** — append `?url=<raw-markdown>`:

  ```
  https://USER.github.io/margin/?url=https://raw.githubusercontent.com/OWNER/REPO/HEAD/README.md
  ```

  Works best with hosts that send permissive CORS headers
  (`raw.githubusercontent.com`, `gist.githubusercontent.com`, `cdn.jsdelivr.net`).
  `github.com/.../blob/...` URLs are auto-rewritten to raw. Remote Markdown is
  rendered through the same safe pipeline as uploads (raw HTML is escaped; no
  `rehype-raw`), so untrusted documents cannot execute script.

## Features

- GitHub-Flavoured Markdown (tables, task lists, strikethrough, autolinks)
- Shiki syntax highlighting, dual light/dark theme driven by CSS
- Mermaid diagrams — responsive, lazy-loaded, errors isolated per block
- Auto table of contents with scroll-spy (sticky sidebar on desktop, bottom sheet on mobile)
- Light / dark / system theme, no flash on load, persisted to `localStorage`
- Mobile-first; `?url=` sharing; Tailscale- and GitHub Pages–friendly
