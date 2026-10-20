import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages can't send headers, so the CSP ships as a meta tag (which ignores frame-ancestors).
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'"

/** Build only: the dev server's inline React-refresh script would break under this policy. */
function csp(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relative paths, so the build works under GitHub Pages' /<repo>/ path and later at a custom domain's root.
  base: './',
  plugins: [react(), csp()],
  // three.js lives in the lazy Chapters chunk (~240 kB gzipped); the text above it doesn't wait for it.
  build: { chunkSizeWarningLimit: 1000 },
})
