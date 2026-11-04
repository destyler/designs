/** Hydrate the actual production Astro island. Does not load or simulate iframe apps. */
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { Window } from 'happy-dom'

const report = { test: 'production Astro Comparison island hydration', checks: [], errors: [], warnings: [], limitations: ['Happy DOM does not prove rendering, actual iframe readiness, focus trapping, or real browser navigation. Iframe ready messages are simulated; page scripts and iframe loads are disabled.'] }
const win = new Window({ url: 'http://localhost:4173/#switch', settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true, disableIframePageLoading: true, disableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true } })
for (const key of Object.getOwnPropertyNames(win)) {
  if (['window', 'document', 'navigator', 'location', 'parent', 'history'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|DocumentFragment|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|KeyboardEvent|MessageEvent|HashChangeEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
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
  const reference = frame('reference'), initialDestyler = frame('destyler'), heading = q('h1')
  let clipboard = ''
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { clipboard = text } } })
  await renderer.default(island)(component[metadata['component-export']], props, {}, { client: 'load' })
  await pause()
  assert.equal(frame('reference'), reference)
  assert.equal(frame('destyler'), initialDestyler)
  assert.equal(q('h1'), heading)
  await handshake('reference'); await handshake('destyler')
  report.checks.push('Production renderer and bundled component hydrate existing SSR heading and both iframe nodes without replacement')
  await click('[aria-label="Toggle shadcn/ui color mode"]')
  assert.equal(q('[aria-label="Toggle shadcn/ui color mode"]').getAttribute('aria-pressed'), 'true')
  assert.equal(q('[aria-label="Toggle Destyler color mode"]').getAttribute('aria-pressed'), 'false')
  const extensions = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
  let previous = initialDestyler, previousFramework = 'react'
  for (const name of ['react', 'vue', 'solid', 'svelte', 'react', 'vue']) {
    const select = q('[aria-label="Destyler framework"]')
    select.value = name; select.dispatchEvent(new win.Event('change', { bubbles: true })); await pause()
    const destyler = frame('destyler')
    assert.equal(frame('reference'), reference, 'Framework preserves reference iframe')
    if (name !== previousFramework) assert.notEqual(destyler, previous, 'Only right iframe changes on framework selection')
    await handshake('destyler')
    assert.equal(document.querySelectorAll('iframe.framework-frame').length, 2)
    assert.match(destyler.src, new RegExp(`/vanilla-extract/${name}/`))
    await click('#code-tab')
    assert.equal(q('#preview-panel').hidden, true)
    assert.equal(q('#code-panel').hidden, false)
    assert.equal(document.querySelectorAll('[aria-label="Source files"] [role="tab"]').length, 6)
    const files = {
      component: `examples/vanilla-extract/${name}/Showcase.${extensions[name]}`,
      styles: 'packages/vanilla-extract/src/styles.css.ts',
      css: 'packages/vanilla-extract/dist/styles.css',
      exports: 'packages/vanilla-extract/dist/index.js',
      shared: 'examples/vanilla-extract/shared/showcase.ts',
      layout: 'examples/vanilla-extract/shared/showcase.css',
    }
    for (const [id, path] of Object.entries(files)) {
      await click(`#source-tab-${id}`)
      const expected = await readFile(path, 'utf8')
      assert.equal(q('[data-testid="css-source"]').textContent, expected, `${name}/${id}: exact current source`)
      assert.equal(q('.source-file-path').textContent, path)
      await click('[aria-label="Copy source"]')
      assert.equal(clipboard, expected)
      assert.equal(q('.source-copy-status').textContent, 'Copied')
      assert.equal(document.querySelectorAll('.source-line-numbers span').length, expected.split('\n').length)
      assert.equal(frame('reference'), reference)
      assert.equal(frame('destyler'), destyler)
    }
    for (const [from, arrow, to] of [['layout','ArrowRight','component'], ['component','ArrowLeft','layout'], ['layout','Home','component'], ['component','End','layout']]) {
      await key(`#source-tab-${from}`, arrow)
      assert.equal(document.activeElement, q(`#source-tab-${to}`))
      assert.equal(q(`#source-tab-${to}`).getAttribute('aria-selected'), 'true')
      assert.equal(document.querySelectorAll('[id^="source-tab-"][tabindex="0"]').length, 1)
    }
    for (const [from, arrow, to] of [['code','ArrowLeft','preview'], ['preview','End','code'], ['code','Home','preview']]) {
      await key(`#${from}-tab`, arrow)
      assert.equal(document.activeElement, q(`#${to}-tab`))
      assert.equal(q(`#${to}-tab`).getAttribute('aria-selected'), 'true')
    }
    assert.equal(q('#preview-panel').hidden, false)
    assert.equal(frame('destyler'), destyler)
    assert.equal(frame('reference'), reference)
    assert.equal(q('[aria-label="Toggle shadcn/ui color mode"]').getAttribute('aria-pressed'), 'true')
    previous = destyler; previousFramework = name
  }
  report.checks.push('Repeated React/Vue/Solid/Svelte selection changes only right frame; preview/code preserves frames; all six source tabs match exact bytes, copy, line counts and keyboard focus')
  await click('[aria-label="Toggle Destyler color mode"]')
  assert.equal(q('[aria-label="Toggle Destyler color mode"]').getAttribute('aria-pressed'), 'true')
  assert.equal(q('[aria-label="Toggle shadcn/ui color mode"]').getAttribute('aria-pressed'), 'true')
  await click('[aria-label="Toggle shadcn/ui color mode"]')
  assert.equal(q('[aria-label="Toggle Destyler color mode"]').getAttribute('aria-pressed'), 'true')
  assert.equal(q('[aria-label="Toggle shadcn/ui color mode"]').getAttribute('aria-pressed'), 'false')
  await click('[aria-label="All light"]')
  for (const label of ['Toggle shadcn/ui color mode', 'Toggle Destyler color mode']) assert.equal(q(`[aria-label="${label}"]`).getAttribute('aria-pressed'), 'false')
  await click('[aria-label="All dark"]')
  for (const label of ['Toggle shadcn/ui color mode', 'Toggle Destyler color mode']) assert.equal(q(`[aria-label="${label}"]`).getAttribute('aria-pressed'), 'true')
  const right = frame('destyler')
  for (const component of ['dialog', 'switch', 'dialog', 'switch']) {
    win.location.hash = `#${component}`
    win.dispatchEvent(new win.HashChangeEvent('hashchange'))
    await pause()
    assert.equal(q('.comparison-grid').dataset.example, component)
    assert.equal(q('h1').textContent.toLowerCase(), component)
    assert.equal(frame('reference'), reference)
    assert.equal(frame('destyler'), right)
    assert.match(frame('reference').title.toLowerCase(), new RegExp(component))
    assert.match(frame('destyler').title.toLowerCase(), new RegExp(component))
  }
  report.checks.push('Independent theme controls and all-light/all-dark; hashchange to dialog and back preserves iframe nodes and updates titles')
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
