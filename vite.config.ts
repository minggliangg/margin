import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// One config works locally (root) and on a GitHub Pages project page (subpath).
//   user/org site (https://USER.github.io/)     -> unset  -> '/'
//   project site (https://USER.github.io/REPO/) -> VITE_BASE='/REPO/'
// An ABSOLUTE base is required (not relative './') so code-split chunks
// (Shiki / Mermaid) resolve correctly on GitHub Pages (vitejs/vite#11804).
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
