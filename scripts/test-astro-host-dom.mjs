/** Hydrate the actual production Astro island. Does not load or simulate iframe apps. */
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { Window } from 'happy-dom'

const frameworks = { react: 'React', vue: 'Vue', solid: 'Solid', svelte: 'Svelte' }
const sides = ['reference', ...Object.keys(frameworks)]
const report = { test: 'production Astro Comparison island hydration', checks: [], errors: [], warnings: [], limitations: ['Happy DOM does not prove rendering, actual iframe readiness, focus trapping, or real browser navigation. Iframe ready messages are simulated; page scripts and iframe loads are disabled. Disabled Happy DOM iframes have null contentWindow, so independent real-window readiness is only covered by the browser suite.'] }
const win = new Window({ url: 'http://localhost:4173/#switch', settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true, disableIframePageLoading: true, disableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true } })
for (const key of Object.getOwnPropertyNames(win)) {
  if (['window', 'document', 'navigator', 'location', 'parent', 'history', 'localStorage'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|DocumentFragment|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|KeyboardEvent|MessageEvent|HashChangeEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
    try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
  }
}
for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
globalThis.window = win; globalThis.document = win.document
const originalError = console.error, originalWarn = console.warn
console.error = (...args) => report.errors.push(args.map(String).join(' '))
console.warn = (...args) => report.warnings.push(args.map(String).join(' '))
win.addEventListener('error', event => report.errors.push(event.message))
const pause = () => new Promise(resolve => setTimeout(resolve, 80))
const q = selector => document.querySelector(selector)
const frame = side => q(`[data-demo="${side}"] iframe.framework-frame`)
const click = async selector => { const node = q(selector); assert.ok(node, selector); node.click(); await pause() }
const key = async (selector, value) => {
  q(selector).focus()
  q(selector).dispatchEvent(new win.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))
  await pause()
}
const handshake = async side => {
  const iframe = frame(side)
  assert.ok(iframe)
  win.dispatchEvent(new win.MessageEvent('message', { origin: win.location.origin, source: iframe.contentWindow, data: { type: 'destyler:ready' } }))
  await pause()
  assert.equal(iframe.getAttribute('aria-busy'), 'false')
}
let island
try {
  document.write(await readFile('dist/index.html', 'utf8'))
  island = q('astro-island[component-url][renderer-url][component-export]')
  assert.ok(island, 'Built Astro component metadata exists')
  const metadata = Object.fromEntries(['component-url', 'renderer-url', 'component-export'].map(name => [name, island.getAttribute(name)]))
  report.metadata = metadata
  const load = url => import(pathToFileURL(resolve('dist', url.replace(/^\//, ''))))
  const component = await load(metadata['component-url'])
  const renderer = await load(metadata['renderer-url'])
  const props = JSON.parse(island.getAttribute('props') || '{}')
  assert.deepEqual(props, {}, 'Comparison requires no encoded Astro props')
  const nodes = Object.fromEntries(sides.map(side => [side, frame(side)])), heading = q('h1')
  let clipboard = ''
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { clipboard = text } } })
  // A stale preference must not hide any of the four implementations.
  win.localStorage.setItem('destyler-designs-framework', 'vue')
  await renderer.default(island)(component[metadata['component-export']], props, {}, { client: 'load' })
  await pause()
  const preserved = () => {
    assert.equal(document.querySelectorAll('iframe.framework-frame').length, 5)
    for (const side of sides) assert.equal(frame(side), nodes[side], `${side}: iframe identity persists`)
  }
  preserved()
  assert.equal(q('h1'), heading)
  assert.equal(q('[aria-label="Destyler framework"]'), null)
  for (const side of sides) {
    const iframe = frame(side)
    assert.equal(iframe.getAttribute('aria-busy'), 'true')
    win.dispatchEvent(new win.MessageEvent('message', { origin: 'https://untrusted.invalid', source: iframe.contentWindow, data: { type: 'destyler:ready' } }))
    await pause()
    assert.equal(iframe.getAttribute('aria-busy'), 'true', 'Foreign-origin readiness ignored')
    win.dispatchEvent(new win.MessageEvent('message', { origin: win.location.origin, source: win, data: { type: 'destyler:ready' } }))
    await pause()
    assert.equal(iframe.getAttribute('aria-busy'), 'true', 'Wrong-window readiness ignored')
  }
  for (const side of sides) await handshake(side)
  const card = name => q(`[data-demo="${name}"]`)
  const view = (name, code) => {
    assert.equal(q(`#${name}-preview-panel`).hidden, code)
    assert.equal(q(`#${name}-code-panel`).hidden, !code)
    assert.equal(q(`#${name}-${code ? 'code' : 'preview'}-tab`).getAttribute('aria-selected'), 'true')
  }
  const extension = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
  const sources = async (name, example) => {
    const files = {
      component: `examples/css-only/${name}/${example === 'switch' ? 'Switch' : 'Dialog'}Example.${extension[name]}`,
      styles: `examples/css-only/${name}/styles.ts`,
      css: 'packages/css-only/styles.css',
    }
    assert.equal(card(name).querySelectorAll(`[aria-label="${frameworks[name]} source files"] [role="tab"]`).length, 3)
    assert.ok(card(name).querySelector(`[data-source-framework="${name}"]`))
    for (const [id, path] of Object.entries(files)) {
      const others = Object.keys(frameworks).filter(other => other !== name).map(other => [other, card(other).querySelector('.source-file-path').textContent])
      await click(`#${name}-source-tab-${id}`)
      const expected = await readFile(path, 'utf8')
      assert.equal(card(name).querySelector('[data-testid="css-source"]').textContent, expected, `${name}/${example}/${id}: exact bytes`)
      assert.equal(card(name).querySelector('.source-file-path').textContent, path)
      assert.equal(card(name).querySelectorAll('.source-line-numbers span').length, expected.split('\n').length)
      await click(`[data-demo="${name}"] [aria-label="Copy source"]`)
      assert.equal(clipboard, expected)
      assert.equal(card(name).querySelector('.source-copy-status').textContent, 'Copied')
      for (const [other, oldPath] of others) assert.equal(card(other).querySelector('.source-file-path').textContent, oldPath, 'File selection is local')
      preserved()
    }
  }
  for (const name of Object.keys(frameworks)) {
    assert.match(frame(name).src, new RegExp(`/css-only/${name}/`))
    await click(`#${name}-code-tab`)
    for (const other of Object.keys(frameworks)) view(other, other === name)
    await sources(name, 'switch')
    for (const [from, arrow, to] of [['css','ArrowRight','component'], ['component','ArrowLeft','css'], ['css','Home','component'], ['component','End','css']]) {
      await key(`#${name}-source-tab-${from}`, arrow)
      assert.equal(document.activeElement, q(`#${name}-source-tab-${to}`))
      assert.equal(q(`#${name}-source-tab-${to}`).getAttribute('aria-selected'), 'true')
      assert.equal(card(name).querySelectorAll('.source-file-tabs [tabindex="0"]').length, 1)
    }
    for (const [from, arrow, to] of [['code','ArrowLeft','preview'], ['preview','End','code'], ['code','Home','preview']]) {
      await key(`#${name}-${from}-tab`, arrow)
      assert.equal(document.activeElement, q(`#${name}-${to}-tab`))
      view(name, to === 'code')
      for (const other of Object.keys(frameworks).filter(other => other !== name)) view(other, false)
    }
  }
  report.checks.push('All five SSR iframe nodes hydrate in place; four independent view/file tab sets, exact source bytes, line counts, clipboard and keyboard navigation')
  const themeLabel = side => `Toggle ${side === 'reference' ? 'shadcn/ui' : frameworks[side]} color mode`
  const dark = side => q(`[aria-label="${themeLabel(side)}"]`).getAttribute('aria-pressed')
  for (const side of sides) {
    assert.equal(dark(side), 'true', `${side}: dark by default`)
    assert.match(frame(side).src, /theme=dark/)
  }
  await click('[aria-label="All light"]')
  for (const side of sides) {
    await click(`[aria-label="${themeLabel(side)}"]`)
    for (const other of sides) assert.equal(dark(other), other === side ? 'true' : 'false')
    await click(`[aria-label="${themeLabel(side)}"]`)
  }
  for (const [label, expected] of [['All dark', 'true'], ['All light', 'false']]) {
    await click(`[aria-label="${label}"]`)
    for (const side of sides) assert.equal(dark(side), expected)
  }
  await click('#react-code-tab'); await click('#solid-code-tab')
  for (const example of ['dialog', 'switch', 'dialog', 'switch']) {
    win.location.hash = `#${example}`
    win.dispatchEvent(new win.HashChangeEvent('hashchange'))
    await pause()
    assert.equal(q('.comparison-grid').dataset.example, example)
    for (const name of Object.keys(frameworks)) {
      view(name, ['react', 'solid'].includes(name))
      assert.equal(q(`#${name}-source-tab-component`).getAttribute('aria-selected'), 'true')
      assert.equal(card(name).querySelector('[data-testid="css-source"]').textContent, await readFile(`examples/css-only/${name}/${example === 'switch' ? 'Switch' : 'Dialog'}Example.${extension[name]}`, 'utf8'))
      await sources(name, example)
    }
    assert.equal(q('h1').textContent.toLowerCase(), example)
    for (const side of sides) assert.match(frame(side).title.toLowerCase(), new RegExp(example))
    preserved()
  }
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id)
  assert.equal(new Set(ids).size, ids.length, 'No duplicate accessibility IDs')
  for (const node of document.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')) {
    for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
      for (const id of (node.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) assert.ok(document.getElementById(id), `${attr} resolves: ${id}`)
    }
  }
  assert.equal(win.localStorage.getItem('destyler-designs-framework'), 'vue', 'No framework preference writes')
  report.checks.push('Independent five-way themes and global theme controls; component navigation resets each source file while retaining mixed view states and every iframe; unique accessible IDs')
  assert.deepEqual(report.errors, [], 'No hydration/runtime errors')
  assert.deepEqual(report.warnings, [], 'No hydration warnings')
  report.pass = true
} catch (error) {
  report.pass = false
  report.exception = error.stack || String(error)
  process.exitCode = 1
} finally {
  island?.dispatchEvent(new win.CustomEvent('astro:unmount'))
  await pause()
  console.error = originalError; console.warn = originalWarn
  await win.happyDOM.close()
  await mkdir('artifacts/astro', { recursive: true })
  await writeFile('artifacts/astro/host-dom-evidence.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
}
