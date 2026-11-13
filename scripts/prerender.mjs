// After the build: render the page to HTML and write it into dist/index.html, so the text shows straight away and the
// script only has to bring the figures to life. The 3D figures render as their placeholders here.
import { readFileSync, rmSync, writeFileSync } from 'node:fs'

const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url))
const file = new URL('../dist/index.html', import.meta.url)
const html = readFileSync(file, 'utf8')
const empty = '<div id="root"></div>'
if (!html.includes(empty)) throw new Error('prerender: no empty #root in dist/index.html')
writeFileSync(file, html.replace(empty, `<div id="root">${render()}</div>`))
rmSync(new URL('../dist-ssr', import.meta.url), { recursive: true, force: true })
console.log('prerender: wrote the page into dist/index.html')
