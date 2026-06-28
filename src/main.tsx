import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

// Self-hosted variable fonts. Importing the CSS lets Vite fingerprint the
// woff2 as first-party assets (no fonts.googleapis.com / fonts.gstatic.com),
// which removes the third-party font panel from Lighthouse and the two
// preconnect hints. wght + italic cover every weight used; unicode-range
// subsets mean a latin visitor only fetches the latin woff2.
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/newsreader/wght.css'
import '@fontsource-variable/newsreader/wght-italic.css'
import '@fontsource-variable/jetbrains-mono/wght.css'

import './index.css'

// Restore the deep-link target saved by the 404.html redirect on GitHub Pages.
const redirect = sessionStorage.getItem('m:redirect')
if (redirect) {
  sessionStorage.removeItem('m:redirect')
  history.replaceState(null, '', redirect)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
