/** Reproducible server-render/hydration checks. Happy DOM is not a browser. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const folder = fileURLToPath(new URL('.', import.meta.url))
const out = join(folder, '.verification')
const mode = process.argv[2]
const pause = () => new Promise(resolve => setTimeout(resolve, 60))
const limitations = ['Happy DOM checks simulated DOM hydration and click behavior. It does not validate CSS rendering, geometry, real clipboard/file-picker/download APIs, focus trapping, assistive technology, or browser keyboard/pointer behavior.']

if (!mode) {
  const { build } = await import('vite')
  const { default: react } = await import('@vitejs/plugin-react')
  await mkdir(out, { recursive: true })
  const clientEntry = join(out, 'client-entry.mjs')
  await writeFile(clientEntry, `import { createElement } from 'react'; import { hydrateRoot } from 'react-dom/client'; import { examples } from '../registry'; export function run(family, target, onError) { const root = hydrateRoot(target, createElement(examples[family]), { onRecoverableError: onError }); return () => root.unmount(); }`)
  await build({ configFile: false, root, logLevel: 'error', plugins: [react()], build: { ssr: join(folder, 'registry.ts'), outDir: out, emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'ssr.mjs' } } } })
  await build({ configFile: false, root, logLevel: 'error', plugins: [react()], build: { outDir: out, emptyOutDir: false, minify: false, lib: { entry: clientEntry, formats: ['es'], fileName: () => 'client.mjs' } } })
  for (const childMode of ['ssr', 'hydrate']) execFileSync(process.execPath, [fileURLToPath(import.meta.url), childMode], { cwd: root, stdio: 'inherit', timeout: 120_000 })
  const ssr = JSON.parse(await readFile(join(out, 'ssr-report.json'), 'utf8'))
  const hydration = JSON.parse(await readFile(join(out, 'hydration-report.json'), 'utf8'))
  const report = { framework: 'react', pass: ssr.pass && hydration.pass, ssr, hydration, limitations }
  await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`React: ${ssr.cases.length}/46 SSR and ${hydration.cases.length}/46 hydration checks passed. Evidence: examples/all-components/react/.verification/verification.json`)
} else if (mode === 'ssr') {
  assert.equal(typeof window, 'undefined')
  assert.equal(typeof document, 'undefined')
  const { createElement } = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { examples } = await import(pathToFileURL(join(out, 'ssr.mjs')))
  const { families } = JSON.parse(await readFile(join(folder, '../shared/catalog.json'), 'utf8'))
  assert.deepEqual(Object.keys(examples).sort(), [...families].sort())
  const markup = {}, cases = []
  for (const [family, Example] of Object.entries(examples)) {
    const errors = [], warnings = []
    const originalError = console.error, originalWarn = console.warn
    console.error = (...args) => errors.push(args.map(String).join(' '))
    console.warn = (...args) => warnings.push(args.map(String).join(' '))
    try { markup[family] = renderToString(createElement(Example)) }
    finally { console.error = originalError; console.warn = originalWarn }
    assert.ok(markup[family].length > 0, family)
    const ids = [...markup[family].matchAll(/\sid="([^"]*)"/g)].map(match => match[1])
    assert.equal(new Set(ids).size, ids.length, `${family}: duplicate SSR IDs`)
    assert.ok(ids.every(id => !/\s/.test(id)), `${family}: whitespace in SSR ID`)
    assert.deepEqual(errors, [], `${family}: SSR errors`)
    assert.deepEqual(warnings, [], `${family}: SSR warnings`)
    cases.push({ family, pass: true, bytes: Buffer.byteLength(markup[family]), errors, warnings })
  }
  await writeFile(join(out, 'ssr-html.json'), JSON.stringify(markup))
  await writeFile(join(out, 'ssr-report.json'), JSON.stringify({ pass: true, noBrowserGlobals: true, cases }, null, 2))
  console.log('React SSR: 46 families, no browser globals.')
} else if (mode === 'hydrate') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/', settings: { disableCSSFileLoading: true, disableIframePageLoading: true } })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win
  globalThis.document = win.document
  const { run } = await import(pathToFileURL(join(out, 'client.mjs')))
  const markup = JSON.parse(await readFile(join(out, 'ssr-html.json'), 'utf8'))
  const cases = []
  const originalError = console.error, originalWarn = console.warn
  const part = (scope, name) => `[data-scope="${scope}"][data-part="${name}"]`
  const q = (scope, name) => document.querySelector(part(scope, name))
  const qa = (scope, name) => [...document.querySelectorAll(part(scope, name))]
  async function interact(family) {
    const actions = []
    if (family === 'calendar') {
      const tables = qa('calendar', 'table')
      assert.deepEqual(tables.map(node => node.dataset.view), ['day'])
      assert.equal(tables[0].dataset.columns, '7')
      assert.ok(!/\s/.test(tables[0].id))
      const month = document.querySelector('select[aria-label="Choose the Month"]')
      const year = document.querySelector('select[aria-label="Choose the Year"]')
      assert.equal(month.value, '11')
      assert.equal(year.value, '2026')
      q('calendar','next-trigger').click(); await pause(); assert.equal(month.value,'12')
      q('calendar','prev-trigger').click(); await pause(); assert.equal(month.value,'11')
      year.value='2027'; year.dispatchEvent(new win.Event('change',{bubbles:true})); await pause()
      assert.ok(qa('calendar','table-cell-trigger').some(node=>node.dataset.value?.startsWith('2027-11')))
      month.value='10'; month.dispatchEvent(new win.Event('change',{bubbles:true})); await pause()
      assert.ok(qa('calendar','table-cell-trigger').some(node=>node.dataset.value?.startsWith('2027-10')))
      const date=qa('calendar','table-cell-trigger').find(node=>node.dataset.value==='2027-10-15')
      assert.ok(date); date.click(); await pause()
      assert.match(document.querySelector('[role="status"]').textContent,/Selected: 2027-10-15/)
      actions.push('Inline calendar: initial month, next/previous, year/month changes, actual date selection')
    }
    if (family === 'progress') {
      const advance=[...document.querySelectorAll('button')].find(node=>node.textContent==='Advance')
      for (const value of [75,85,95,100,0]) {
        advance.click(); await pause()
        assert.equal(document.querySelector('[role="status"]').textContent,`${value}%`)
        assert.equal(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),String(value))
      }
      actions.push('Progress advances 65→100 and resets to 0 with matching output and ARIA')
    }
    if (family === 'pagination') {
      for (const value of [2,10,9,1]) {
        const trigger=qa('pagination','item').find(node=>node.textContent===String(value))
        assert.ok(trigger); trigger.click(); await pause()
        assert.match(document.querySelector('[role="status"]').textContent,new RegExp(`Page ${value} of 10`))
      }
      actions.push('Pagination 1→2→10→9→1 updates output')
    }
    if (family === 'clipboard') {
      let copied=''
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}})
      document.querySelector('button').click(); await pause()
      assert.equal(copied,'https://destyler.org')
      assert.equal(document.querySelector('[role="status"]').textContent,'Copied')
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('permission denied')}}})
      document.querySelector('button').click(); await pause()
      assert.match(document.querySelector('[role="status"]').textContent,/Copy unavailable/)
      actions.push('Clipboard reports resolved success and rejected failure honestly (mock API)')
    }
    if (family === 'splitter') {
      const separator = q('splitter', 'resize-trigger')
      assert.equal(separator.getAttribute('role'), 'separator')
      assert.equal(separator.getAttribute('aria-label'), 'Resize A and B panels')
      actions.push('Focusable resize separator has a descriptive accessible name')
    }
    if (family === 'scroll-area') {
      const thumbs = qa('scroll-area', 'thumb')
      assert.equal(thumbs.length, 2)
      assert.deepEqual(thumbs.map(node => node.dataset.orientation), ['vertical', 'horizontal'])
      assert.equal(new Set(thumbs.map(node => node.id)).size, 2)
      for (const thumb of thumbs) {
        assert.equal(thumb.dataset.orientation, thumb.parentElement.dataset.orientation)
        assert.ok(thumb.id.endsWith(thumb.dataset.orientation === 'vertical' ? ':thumb-y' : ':thumb-x'))
      }
      actions.push('Distinct horizontal/vertical thumb IDs match parent orientations')
    }
    if (family === 'checkbox') {
      const input = document.querySelector('input[type=checkbox]')
      for (let i = 0; i < 2; i++) {
        input.click(); await pause(); assert.equal(input.checked, true)
        input.click(); await pause(); assert.equal(input.checked, false)
      }
      actions.push('Two check/uncheck cycles')
    }
    if (family === 'dialog') {
      for (let i = 0; i < 2; i++) {
        q('dialog', 'trigger').click(); await pause(); assert.equal(q('dialog', 'content').hidden, false)
        q('dialog', 'close-trigger').click(); await pause(); assert.equal(q('dialog', 'content').hidden, true)
      }
      actions.push('Two open/close cycles with client-mounted portal')
    }
    if (family === 'tabs') {
      const tabs = qa('tabs', 'trigger').filter(node => !node.disabled)
      for (const tab of [...tabs, ...tabs].reverse()) {
        tab.click(); await pause(); assert.equal(tab.getAttribute('aria-selected'), 'true')
        assert.equal(document.getElementById(tab.getAttribute('aria-controls')).hidden, false)
      }
      actions.push('Selected all three enabled tabs twice')
    }
    if (family === 'select') {
      const trigger = q('select', 'trigger')
      for (const value of ['react', 'vue', 'react']) {
        trigger.click(); await pause(); assert.equal(trigger.getAttribute('aria-expanded'), 'true')
        const item = qa('select', 'item').find(node => node.dataset.value === value)
        assert.ok(item, value); item.click(); await pause()
        assert.equal(trigger.getAttribute('aria-expanded'), 'false')
        assert.equal(document.querySelector('select').value, value)
      }
      actions.push('Opened and selected React, Vue, React')
    }
    if (family === 'steps') {
      for (let cycle = 0; cycle < 2; cycle++) {
        for (let i = 0; i < 3; i++) { q('steps', 'next-trigger').click(); await pause() }
        assert.equal(q('steps', 'content').hidden, true)
        assert.ok([...document.querySelectorAll('[data-scope="steps"][data-complete]')].length > 0)
        for (let i = 0; i < 3; i++) { q('steps', 'prev-trigger').click(); await pause() }
        assert.equal(q('steps', 'content').hidden, false)
      }
      actions.push('Two complete-and-return step cycles')
    }
    if (family === 'dynamic') {
      assert.equal(qa('dynamic', 'item').length, 3)
      q('dynamic', 'item-delete-trigger').click(); await pause(); assert.equal(qa('dynamic', 'item').length, 2)
      q('dynamic', 'clear-trigger').click(); await pause(); assert.equal(qa('dynamic', 'item').length, 0)
      actions.push('Removed a tag and cleared remaining tags')
    }
    if (family === 'tree') {
      const trigger = q('tree-view', 'branch-trigger')
      if (trigger) {
        for (let i = 0; i < 2; i++) {
          trigger.click(); await pause(); assert.equal(q('tree-view', 'branch-content').hidden, false)
          trigger.click(); await pause(); assert.equal(q('tree-view', 'branch-content').hidden, true)
        }
        actions.push('Two branch expand/collapse cycles')
      } else throw new Error('Tree branch trigger not found')
    }
    if (family === 'tour') {
      const start = document.querySelector('main > button')
      for (let i = 0; i < 2; i++) {
        start.click(); await pause(); assert.equal(q('tour', 'content').hidden, false)
        q('tour', 'close-trigger').click(); await pause(); assert.equal(q('tour', 'content').hidden, true)
      }
      actions.push('Two start/dismiss cycles')
    }
    return actions
  }
  try {
    for (const [family, html] of Object.entries(markup)) {
      const errors = [], warnings = []
      const result = { family, pass: false, serverNodesRetained: false, actions: [], errors, warnings }
      console.error = (...args) => errors.push(args.map(String).join(' '))
      console.warn = (...args) => warnings.push(args.map(String).join(' '))
      document.body.innerHTML = `<div id="app">${html}</div>`
      const target = document.getElementById('app')
      const original = target.firstElementChild
      const originalElements = [...target.querySelectorAll('*')]
      let cleanup
      try {
        cleanup = run(family, target, error => errors.push(String(error)))
        await pause()
        assert.equal(target.firstElementChild, original, `${family}: hydration replaced the first server element`)
        assert.ok(originalElements.every(node => target.contains(node)), `${family}: hydration removed a server element`)
        result.serverNodesRetained = true
        result.retainedElementCount = originalElements.length
        result.actions = await interact(family)
      } catch (error) { result.exception = String(error.stack || error) }
      finally { if (cleanup) { cleanup(); await pause() } }
      result.pass = !result.exception && errors.length === 0 && warnings.length === 0
      cases.push(result)
      console.error = originalError; console.warn = originalWarn
      console.log(`${result.pass ? 'PASS' : 'FAIL'} React hydrate ${family}${result.exception ? ': ' + result.exception : ''}`)
    }
  } finally { console.error = originalError; console.warn = originalWarn; await win.happyDOM.close() }
  const report = { pass: cases.length === 46 && cases.every(row => row.pass), cases, limitations }
  await writeFile(join(out, 'hydration-report.json'), JSON.stringify(report, null, 2) + '\n')
  assert.equal(report.pass, true, 'One or more React hydration/interaction checks failed; see .verification/hydration-report.json')
} else throw new Error(`Unknown mode: ${mode}`)
