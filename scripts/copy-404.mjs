// Cross-platform SPA fallback for GitHub Pages: serve the app shell at /404.html
// so a hard refresh of any client route (or a ?url= deep link) rehydrates the SPA
// instead of hitting GitHub's 404. Runs after every `vite build`.
import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/index.html'
const dest = 'dist/404.html'

if (!existsSync(src)) {
  console.error(`[copy-404] ${src} not found — did the build run?`)
  process.exit(1)
}

copyFileSync(src, dest)
console.log('[copy-404] wrote dist/404.html')
