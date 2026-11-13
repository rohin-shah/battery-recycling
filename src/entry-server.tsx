import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'

/** Used at build time only (scripts/prerender.mjs): the page's HTML, so the text shows before any script has run. */
export const render = () =>
  renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
