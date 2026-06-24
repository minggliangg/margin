import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
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
