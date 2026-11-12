import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// One config works locally (root) and on a GitHub Pages project page (subpath).
//   user/org site (https://USER.github.io/)     -> unset  -> '/'
//   project site (https://USER.github.io/REPO/) -> VITE_BASE='/REPO/'
// An ABSOLUTE base is required (not relative './') so code-split chunks
// (Shiki / Mermaid) resolve correctly on GitHub Pages (vitejs/vite#11804).
const base = process.env.VITE_BASE ?? '/'

// Identifies this build. The app compares it to /version.json on the server so
// an installed (home-screen) copy can tell when a newer deploy exists.
const buildId = process.env.GITHUB_SHA?.slice(0, 7) ?? Date.now().toString(36)

const versionFile = (): Plugin => ({
  name: 'margin-version-file',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ id: buildId }),
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile()],
  base,
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
