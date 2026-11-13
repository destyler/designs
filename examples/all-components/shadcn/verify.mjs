/** Reproducible SSR + Happy DOM evidence, deliberately not a real-browser/AT claim. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const folder = fileURLToPath(new URL('.', import.meta.url))
const out = join(folder, '.verification')
const mode = process.argv[2]
const selectedFamily = process.argv[3]
const pause = (ms = 90) => new Promise(resolve => setTimeout(resolve, ms))
const limitations = [
  'Happy DOM checks simulated hydration and selected event/state transitions, not real browser rendering or accessibility conformance.',
  'CSS, responsive layout, carousel/splitter/slider geometry, wheel/touch/pointer behavior, portal positioning, focus trapping, real clipboard permissions, file APIs and assistive technology remain pending real-browser/AT checks.',
  '13 families intentionally render an informative absence state, not a counterfeit control. Direct means a corresponding upstream family, not full API, behavior or visual parity.',
]

if (!mode) {
  const { build } = await import('vite')
  const { default: react } = await import('@vitejs/plugin-react')
  const aliases = {
    cn: join(root, 'examples/shadcn/lib/utils.ts'),
    '@/lib/utils': join(root, 'examples/shadcn/lib/utils.ts'),
    '@/registry/new-york-v4/ui': join(root, 'vendor/shadcn/new-york-v4/ui'),
  }
  await mkdir(out, { recursive: true })
  const clientEntry = join(out, 'client-entry.mjs')
  await writeFile(clientEntry, `import { createElement } from 'react'; import { createRoot, hydrateRoot } from 'react-dom/client'; import { examples } from '../registry'; import { Frame } from '../Frame'; export { resolveFrameRequest } from '../configuration'; export function run(family, target, onError) { const root = hydrateRoot(target, createElement(examples[family]), { onRecoverableError: onError, onUncaughtError: onError, onCaughtError: onError }); return () => root.unmount(); } export function mountFrame(family, theme, target, valid = true, onError) { const root = createRoot(target, { onRecoverableError: onError, onUncaughtError: onError, onCaughtError: onError }); root.render(createElement(Frame, { family, theme, valid })); return () => root.unmount(); }`)
  const common = { configFile: false, root, logLevel: 'error', plugins: [react()], resolve: { alias: aliases } }
  await build({ ...common, build: { ssr: join(folder, 'registry.tsx'), outDir: out, emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'ssr.mjs' } } } })
  await build({ ...common, build: { outDir: out, emptyOutDir: false, minify: false, lib: { entry: clientEntry, formats: ['es'], fileName: () => 'client.mjs' } } })
  for (const childMode of ['ssr', 'hydrate']) execFileSync(process.execPath, [fileURLToPath(import.meta.url), childMode], { cwd: root, stdio: 'inherit', timeout: 180_000 })
  const ssr = JSON.parse(await readFile(join(out, 'ssr-report.json'), 'utf8'))
  const hydration = JSON.parse(await readFile(join(out, 'hydration-report.json'), 'utf8'))
  const report = { framework: 'shadcn', sourceCommit: '4aaea19d9cff3e0908e12a8c1d504b8c5ec34610', pass: ssr.pass && hydration.pass, coverage: { direct: 32, composed: 1, none: 13 }, ssr, hydration, limitations }
  await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`shadcn: ${ssr.cases.length}/46 SSR and ${hydration.cases.length}/46 hydration checks passed. Evidence: examples/all-components/shadcn/.verification/verification.json`)
} else if (mode === 'ssr') {
  assert.equal(typeof window, 'undefined')
  assert.equal(typeof document, 'undefined')
  const { createElement } = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { examples, coverage } = await import(pathToFileURL(join(out, 'ssr.mjs')))
  const { families } = JSON.parse(await readFile(join(folder, '../shared/catalog.json'), 'utf8'))
  assert.deepEqual(Object.keys(examples).sort(), [...families].sort())
  assert.deepEqual(Object.keys(coverage).sort(), [...families].sort())
  const markup = {}, cases = []
  for (const [family, Example] of Object.entries(examples)) {
    const errors = [], warnings = []
    const originalError = console.error, originalWarn = console.warn
    console.error = (...args) => errors.push(args.map(String).join(' '))
    console.warn = (...args) => warnings.push(args.map(String).join(' '))
    try { markup[family] = renderToString(createElement(Example)) }
    finally { console.error = originalError; console.warn = originalWarn }
    assert.ok(markup[family].includes(`data-reference-family="${family}"`), family)
    assert.ok(markup[family].includes(`data-reference-state="${coverage[family].status}"`), family)
    const ids = [...markup[family].matchAll(/\sid="([^"]*)"/g)].map(match => match[1])
    assert.equal(new Set(ids).size, ids.length, `${family}: duplicate SSR IDs`)
    assert.ok(ids.every(id => !/\s/.test(id)), `${family}: whitespace in SSR ID`)
    assert.deepEqual(errors, [], `${family}: SSR errors`)
    assert.deepEqual(warnings, [], `${family}: SSR warnings`)
    assert.ok(coverage[family].explanation.length > 40)
    assert.ok(coverage[family].sourceUrls.every(url => url.includes('/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/')))
    if (coverage[family].status === 'none') {
      assert.deepEqual(coverage[family].components, [])
      assert.match(markup[family], /No original shadcn counterpart/)
      assert.doesNotMatch(markup[family], /<(input|button|select|canvas)\b/)
    } else {
      assert.ok(coverage[family].components.length)
      const source = await readFile(join(folder, 'demos', `${family}.tsx`), 'utf8')
      assert.match(source, /@\/registry\/new-york-v4\/ui\//)
      assert.doesNotMatch(source, /@destyler-ui\//)
    }
    cases.push({ family, status: coverage[family].status, pass: true, bytes: Buffer.byteLength(markup[family]), errors, warnings })
  }
  await writeFile(join(out, 'ssr-html.json'), JSON.stringify(markup))
  await writeFile(join(out, 'ssr-report.json'), JSON.stringify({ pass: true, noBrowserGlobals: true, cases }, null, 2))
  console.log('shadcn SSR: 46 families, no browser globals; honest source/absence classifications verified.')
} else if (mode === 'hydrate') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/all-components/shadcn/', settings: { disableCSSFileLoading: true, disableIframePageLoading: true } })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|DocumentFragment|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event.*|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|FocusEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|DOMRect.*|Range|TreeWalker)$/.test(key)) {
      try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'getSelection']) globalThis[key] = win[key].bind(win)
  globalThis.window = win
  globalThis.document = win.document
  const { run, mountFrame, resolveFrameRequest } = await import(pathToFileURL(join(out, 'client.mjs')))
  const markup = JSON.parse(await readFile(join(out, 'ssr-html.json'), 'utf8'))
  const coverage = JSON.parse(await readFile(join(folder, '../shared/shadcn-coverage.json'), 'utf8'))
  const cases = []
  const originalError = console.error, originalWarn = console.warn
  const originalWindowError = win.console.error, originalWindowWarn = win.console.warn
  const q = slot => document.querySelector(`[data-slot="${slot}"]`)
  const qa = slot => [...document.querySelectorAll(`[data-slot="${slot}"]`)]
  const findText = (selector, text) => [...document.querySelectorAll(selector)].find(node => node.textContent.trim() === text)
  async function click(node) { assert.ok(node, 'Expected click target'); node.click(); await pause() }
  async function pointerDown(node) { assert.ok(node, 'Expected pointer target'); node.dispatchEvent(new win.PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse', ctrlKey: false })); await pause() }
  async function type(node, value) { assert.ok(node, 'Expected input'); Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(node, value); node.dispatchEvent(new win.Event('input', { bubbles: true })); await pause() }
  async function interact(family) {
    const actions = []
    if (coverage[family].status === 'none') {
      assert.ok(document.querySelector('.reference-absence'))
      assert.equal(document.querySelector('main input, main button, main select, main canvas'), null)
      return ['Verified informative absence with pinned source link and no imitated control']
    }
    if (family === 'checkbox' || family === 'switch') {
      const button = document.querySelector(`[role="${family}"]`)
      for (let i = 0; i < 2; i++) { await click(button); assert.equal(button.getAttribute('aria-checked'), 'true'); await click(button); assert.equal(button.getAttribute('aria-checked'), 'false') }
      actions.push('Two checked/unchecked cycles through original Radix component')
    }
    if (family === 'collapse' || family === 'collapsible') {
      const trigger = family === 'collapse' ? qa('accordion-trigger')[0] : q('collapsible-trigger')
      for (let i = 0; i < 2; i++) { await click(trigger); assert.equal(trigger.getAttribute('aria-expanded'), 'true'); await click(trigger); assert.equal(trigger.getAttribute('aria-expanded'), 'false') }
      if (family === 'collapse') assert.equal(qa('accordion-trigger').find(node => node.textContent.includes('Svelte')).disabled, true)
      actions.push('Two expanded/collapsed cycles; original disclosure state')
    }
    if (family === 'dialog') {
      for (let i = 0; i < 2; i++) {
        await click(q('dialog-trigger')); assert.ok(document.querySelector('[role="dialog"]'))
        await click(findText('button', 'Cancel')); assert.equal(document.querySelector('[role="dialog"]'), null)
      }
      await click(q('dialog-trigger'))
      document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await pause()
      assert.equal(document.querySelector('[role="dialog"]'), null)
      actions.push('Two open/cancel cycles and Escape dismissal through original portalled Dialog')
    }
    if (family === 'tabs') {
      for (const tab of [...qa('tabs-trigger'), ...qa('tabs-trigger')].filter(node => !node.disabled).reverse()) {
        tab.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, button: 0, ctrlKey: false })); await pause()
        assert.equal(tab.getAttribute('aria-selected'), 'true')
        assert.equal(document.getElementById(tab.getAttribute('aria-controls')).hidden, false)
      }
      assert.equal(qa('tabs-trigger').find(node => node.textContent.includes('Svelte')).disabled, true)
      actions.push('Selected all three enabled tabs twice; disabled Svelte retained')
    }
    if (family === 'toggle') {
      const trigger = q('toggle')
      for (let i = 0; i < 2; i++) { await click(trigger); assert.equal(trigger.getAttribute('aria-pressed'), 'true'); await click(trigger); assert.equal(trigger.getAttribute('aria-pressed'), 'false') }
      actions.push('Two pressed/unpressed cycles')
    }
    if (family === 'toggle-group') {
      for (const trigger of [...qa('toggle-group-item'), ...qa('toggle-group-item')]) { await click(trigger); assert.equal(trigger.getAttribute('aria-checked'), 'true') }
      actions.push('Selected all three original ToggleGroup options twice')
    }
    if (family === 'radio') {
      for (const trigger of [...qa('radio-group-item'), ...qa('radio-group-item')].filter(node => !node.disabled)) { await click(trigger); assert.equal(trigger.getAttribute('aria-checked'), 'true') }
      assert.equal(document.getElementById('reference-radio-Svelte').disabled, true)
      actions.push('Selected React, Solid, Vue twice; disabled Svelte excluded')
    }
    if (family === 'select') {
      for (const value of ['React', 'Vue', 'React']) {
        await pointerDown(q('select-trigger')); assert.equal(q('select-trigger').getAttribute('aria-expanded'), 'true')
        const option = qa('select-item').find(node => node.textContent.trim() === value)
        await click(option); assert.equal(q('select-trigger').getAttribute('aria-expanded'), 'false')
        assert.equal(document.querySelector('[role="status"]').textContent, value.toLowerCase())
      }
      actions.push('Opened original Select and selected React, Vue, React')
    }
    if (family === 'combobox') {
      assert.ok(document.querySelector('label[for="reference-combobox"]'))
      assert.equal(document.querySelector('button[aria-haspopup="listbox"]').getAttribute('aria-label'), 'Open framework options')
      assert.equal(findText('button', 'Clear').disabled, true)
      for (const value of ['React', 'Vue']) {
        const input = document.querySelector('[role="combobox"]')
        await click(document.querySelector('button[aria-haspopup="listbox"]')); await pause()
        assert.equal(input.getAttribute('aria-expanded'), 'true')
        const option = qa('combobox-item').find(node => node.textContent.trim() === value)
        await click(option)
        assert.equal(document.querySelector('[role="status"]').textContent, value)
        assert.equal(input.getAttribute('aria-expanded'), 'false')
        assert.equal(findText('button', 'Clear').disabled, false)
        await click(findText('button', 'Clear'))
        assert.equal(document.querySelector('[role="status"]').textContent, 'No selection')
      }
      assert.equal(findText('button', 'Clear').disabled, true)
      actions.push('Selected and cleared React and Vue using original Base UI Combobox; trigger/input names and visible Clear label verified')
    }
    if (family === 'popover') {
      for (let i = 0; i < 2; i++) { await click(q('popover-trigger')); assert.ok(q('popover-content')); await click(findText('button', 'close')); assert.equal(q('popover-content'), null) }
      actions.push('Two open/close cycles through original portalled Popover')
    }
    if (family === 'menu') {
      await pointerDown(q('dropdown-menu-trigger'))
      await click(findText('[role="menuitemcheckbox"]', 'Check me'))
      assert.match(document.querySelector('[role="status"]').textContent, /Checked/)
      for (const value of ['react', 'vue']) { await pointerDown(q('dropdown-menu-trigger')); await click(findText('[role="menuitemradio"]', value)); assert.match(document.querySelector('[role="status"]').textContent, new RegExp(value)) }
      actions.push('Toggled original menu checkbox and selected two radio menu items')
    }
    if (family === 'navigation-menu') {
      await click(findText('button', 'Getting started')); assert.ok(findText('a', 'Introduction'))
      await click(findText('a', 'Introduction')); assert.equal(document.querySelector('[role="status"]').textContent, 'Introduction')
      await click(findText('a', 'Documentation')); assert.equal(document.querySelector('[role="status"]').textContent, 'Documentation')
      actions.push('Opened original navigation content and selected internal demo links')
    }
    if (family === 'pagination') {
      for (let i = 0; i < 2; i++) { await click(document.querySelector('[aria-label="Go to next page"]')); assert.match(document.querySelector('[role="status"]').textContent, /Page 2 of 10/); await click(document.querySelector('[aria-label="Go to previous page"]')); assert.match(document.querySelector('[role="status"]').textContent, /Page 1 of 10/) }
      await click(findText('a', '10')); assert.equal(document.querySelector('[aria-current="page"]').textContent, '10')
      await click(document.querySelector('[aria-label="Go to next page"]')); assert.match(document.querySelector('[role="status"]').textContent, /Page 10 of 10/)
      actions.push('Two next/previous cycles plus final-page boundary')
    }
    if (family === 'calendar') {
      const day = document.querySelector('[data-day="11/12/2026"]')
      await click(day); assert.match(document.querySelector('main > div > p[role="status"]').textContent, /2026-11-12/)
      const next = document.querySelector('[aria-label="Go to the Next Month"]')
      await click(next); assert.ok(document.querySelector('[data-day="12/12/2026"]'))
      await click(document.querySelector('[aria-label="Go to the Previous Month"]')); assert.ok(document.querySelector('[data-day="11/12/2026"]'))
      actions.push('Selected a day and navigated next/previous month in original Calendar')
    }
    if (family === 'progress') {
      assert.equal(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'), '65')
      for (let i = 0; i < 5; i++) await click(findText('button', 'Advance'))
      assert.equal(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'), '0')
      assert.equal(q('progress-indicator').style.transform, 'translateX(-100%)')
      assert.equal(q('progress').getAttribute('data-state'), 'indeterminate')
      actions.push('Advanced visual Progress from 65% to 100% then reset; explicit application ARIA value updates; upstream internal state remains indeterminate')
    }
    if (family === 'slider') {
      const thumbs = [...document.querySelectorAll('[role="slider"]')]
      assert.equal(thumbs.length, 2)
      assert.deepEqual(thumbs.map(node => node.getAttribute('aria-valuenow')), ['-20', '20'])
      thumbs[0].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await pause()
      assert.equal(thumbs[0].getAttribute('aria-valuenow'), '-19')
      thumbs[0].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); await pause()
      assert.equal(thumbs[0].getAttribute('aria-valuenow'), '-20')
      actions.push('Original range thumbs retain values and respond to simulated arrow keys')
    }
    if (family === 'splitter') {
      const handle = q('resizable-handle')
      assert.equal(handle.getAttribute('role'), 'separator')
      assert.equal(handle.getAttribute('aria-label'), 'Resize A and B panels')
      assert.equal(qa('resizable-panel').length, 2)
      actions.push('Original v4 resizable separator and two panels mounted; drag geometry pending browser')
    }
    if (family === 'scroll-area') {
      assert.ok(q('scroll-area-viewport'))
      assert.equal(q('scroll-area-viewport').textContent.includes('v1.2.0-beta.50'), true)
      assert.equal(q('scroll-area-viewport').querySelectorAll('p').length, 50)
      actions.push('Original ScrollArea viewport and 50 items mounted; overflow geometry pending browser')
    }
    if (family === 'carousel') {
      assert.equal(qa('carousel-item').length, 5)
      assert.ok(q('carousel-next')); assert.ok(q('carousel-previous'))
      actions.push('Original Embla Carousel, five slides and controls mounted; slide geometry pending browser')
    }
    if (family === 'field' || family === 'fieldset' || family === 'label') {
      const input = document.querySelector('input')
      assert.ok(document.querySelector(`label[for="${input.id}"]`))
      await type(input, 'Example'); assert.equal(input.value, 'Example')
      for (const id of (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean)) assert.ok(document.getElementById(id), `Missing description target: ${id}`)
      if (family === 'fieldset') for (const id of q('field-set').getAttribute('aria-describedby').split(' ')) assert.ok(document.getElementById(id))
      if (family === 'field') { assert.equal(input.getAttribute('aria-invalid'), 'true'); assert.ok(document.getElementById('reference-field-error')) }
      actions.push('Original labeled Input accepts text; helper/error associations retained')
    }
    if (family === 'otp-input') {
      const input = document.querySelector('input')
      await type(input, '123')
      assert.equal(document.querySelector('[role="status"]').textContent, '3/3 characters')
      assert.equal(qa('input-otp-slot').map(node => node.textContent.trim()).join(''), '123')
      actions.push('Original InputOTP reflects three entered characters in its slots')
    }
    if (family === 'toast') {
      await click(findText('button', 'Create Toast')); assert.ok(document.querySelector('[data-sonner-toast]'))
      await click(document.querySelector('[data-close-button]')); await pause(300)
      assert.equal(document.querySelector('[data-sonner-toast]'), null)
      await click(findText('button', 'Create Toast')); assert.ok(document.querySelector('[data-sonner-toast]'))
      actions.push('Created, dismissed and recreated real Sonner toast through original wrapper')
    }
    if (family === 'clipboard') {
      const previous = navigator.clipboard.writeText
      let copied
      navigator.clipboard.writeText = async value => { copied = value }
      await click(findText('button', 'Copy link')); assert.equal(copied, 'https://destyler.org'); assert.equal(document.querySelector('[role="status"]').textContent, 'Copied')
      navigator.clipboard.writeText = async () => { throw new Error('Denied in simulated test') }
      await click(findText('button', 'Copy link')); assert.match(document.querySelector('[role="status"]').textContent, /Copy unavailable/)
      navigator.clipboard.writeText = previous
      actions.push('Composition success and failure feedback with explicitly mocked Clipboard API; no real clipboard claim')
    }
    if (family === 'breadcrumbs') { await click(findText('a', 'Products')); assert.equal(document.querySelector('[role="status"]').textContent, 'Selected: Products'); actions.push('Original Breadcrumb link updates local demo state without leaving frame') }
    if (family === 'hover-card') { q('hover-card-trigger').focus(); await pause(); assert.ok(q('hover-card-content')); q('hover-card-trigger').blur(); await pause(); assert.equal(q('hover-card-content'), null); actions.push('Original HoverCard opens/closes on simulated focus/blur') }
    if (family === 'tooltip') { q('tooltip-trigger').focus(); await pause(); assert.ok(document.querySelector('[role="tooltip"]')); q('tooltip-trigger').blur(); await pause(); assert.equal(document.querySelector('[role="tooltip"]'), null); actions.push('Original Tooltip opens/closes on simulated focus/blur') }
    if (family === 'avatar') { assert.ok(q('avatar')); assert.equal(q('avatar-fallback').textContent, 'EL'); actions.push('Original Avatar and fallback mounted; image load behavior pending real browser') }
    if (family === 'aspect-ratio') { assert.ok(document.querySelector('img[alt="Geometric illustration"]')); actions.push('Original AspectRatio and local illustration mounted; geometry pending real browser') }
    if (family === 'separator') { assert.equal(qa('separator').length, 3); actions.push('Original horizontal and vertical Separators mounted') }
    return actions
  }
  let readiness
  try {
    for (const [family, html] of Object.entries(markup)) {
      if (selectedFamily && family !== selectedFamily) continue
      const errors = [], warnings = []
      const result = { family, status: coverage[family].status, pass: false, serverNodesRetained: false, actions: [], errors, warnings }
      console.error = (...args) => errors.push(args.map(String).join(' '))
      console.warn = (...args) => warnings.push(args.map(String).join(' '))
      win.console.error = (...args) => errors.push(args.map(String).join(' '))
      win.console.warn = (...args) => warnings.push(args.map(String).join(' '))
      const onWindowError = event => errors.push(String(event.error?.stack || event.error || event.message))
      const onWindowRejection = event => errors.push(String(event.reason?.stack || event.reason || 'Unhandled rejection'))
      win.addEventListener('error', onWindowError)
      win.addEventListener('unhandledrejection', onWindowRejection)
      document.body.innerHTML = `<div id="app">${html}</div>`
      const target = document.getElementById('app')
      const original = target.firstElementChild
      const originalElements = [...target.querySelectorAll('*')]
      let cleanup
      try {
        cleanup = run(family, target, error => errors.push(String(error)))
        await pause(150)
        assert.ok(target.firstElementChild === original, `${family}: hydration replaced first server element`)
        const removed = originalElements.filter(node => !target.contains(node))
        result.postMountRemovals = removed.map(node => ({ tag: node.tagName, type: node.getAttribute('type'), hidden: node.getAttribute('aria-hidden') }))
        // Radix renders form-compatibility fields on the server before it can inspect
        // closest('form'). Outside a form, those specific hidden fields disappear
        // after mount. Preserve and count every actual interactive server node.
        const permittedRemoval = node => {
          if (['checkbox', 'radio', 'switch'].includes(family)) return node.tagName === 'INPUT' && node.getAttribute('aria-hidden') === 'true' && node.getAttribute('type') === (family === 'radio' ? 'radio' : 'checkbox')
          if (family === 'slider') return node.tagName === 'INPUT' && node.style.display === 'none'
          if (family === 'select') return (node.tagName === 'SELECT' && node.getAttribute('aria-hidden') === 'true') || (node.tagName === 'OPTION' && node.parentElement?.tagName === 'SELECT' && node.parentElement.getAttribute('aria-hidden') === 'true')
          return false
        }
        assert.ok(removed.every(permittedRemoval), `${family}: hydration unexpectedly removed a server element`)
        assert.equal(removed.length, ({ checkbox: 1, radio: 4, switch: 1, select: 2, slider: 2 })[family] || 0, `${family}: unexpected hidden form-field removals`)
        result.serverNodesRetained = removed.length === 0
        result.interactiveServerNodesRetained = true
        result.retainedElementCount = originalElements.length - removed.length
        result.serverElementCount = originalElements.length
        await writeFile(join(out, `${family}-mounted.html`), document.body.innerHTML)
        result.actions = await interact(family)
        assert.ok(result.actions.length, `${family}: no meaningful check`)
      } catch (error) { result.exception = String(error.stack || error) }
      finally {
        if (cleanup) { cleanup(); await pause() }
        win.removeEventListener('error', onWindowError)
        win.removeEventListener('unhandledrejection', onWindowRejection)
        win.console.error = originalWindowError; win.console.warn = originalWindowWarn
      }
      result.pass = !result.exception && errors.length === 0 && warnings.length === 0
      cases.push(result)
      console.error = originalError; console.warn = originalWarn
      console.log(`${result.pass ? 'PASS' : 'FAIL'} shadcn hydrate ${family}${result.exception ? ': ' + result.exception : ''}${errors.length ? ': ' + errors.join(' | ') : ''}${warnings.length ? ': ' + warnings.join(' | ') : ''}`)
    }
    // Query parser is shared with main.tsx. Observe readiness only after commit,
    // and capture browser/React errors through every readiness mount and cleanup.
    const messages = [], errors = [], warnings = []
    const originalPostMessage = win.postMessage.bind(win)
    const onWindowError = event => errors.push(String(event.error?.stack || event.error || event.message))
    const onWindowRejection = event => errors.push(String(event.reason?.stack || event.reason || 'Unhandled rejection'))
    win.addEventListener('error', onWindowError)
    win.addEventListener('unhandledrejection', onWindowRejection)
    console.error = win.console.error = (...args) => errors.push(args.map(String).join(' '))
    console.warn = win.console.warn = (...args) => warnings.push(args.map(String).join(' '))
    win.postMessage = (data, origin) => { messages.push({ data, origin, mounted: !!document.querySelector('[data-reference-family]') }) }
    const queries = [
      ['?component=checkbox&theme=light', { requested: 'checkbox', family: 'checkbox', theme: 'light', valid: true }],
      ['?component=tree&theme=dark', { requested: 'tree', family: 'tree', theme: 'dark', valid: true }],
      ['?component=not-a-component&theme=dark', { requested: 'not-a-component', family: 'checkbox', theme: 'dark', valid: false }],
      ['', { requested: 'checkbox', family: 'checkbox', theme: 'light', valid: true }],
      ['?component=checkbox&theme=invalid', { requested: 'checkbox', family: 'checkbox', theme: 'light', valid: true }],
    ]
    for (const [query, expected] of queries) {
      const config = resolveFrameRequest(query)
      assert.deepEqual(config, expected)
      const { family, theme, valid } = config
      document.body.innerHTML = '<div id="app"></div>'
      const count = messages.length
      const cleanup = mountFrame(family, theme, document.getElementById('app'), valid, error => errors.push(String(error)))
      assert.equal(messages.length, count, 'Ready must not be emitted synchronously before render')
      await pause()
      assert.equal(messages.length, count + (valid ? 1 : 0))
      if (valid) assert.deepEqual(messages.at(-1), { data: { type: 'destyler:all-components-ready', framework: 'shadcn', family, theme }, origin: 'http://localhost', mounted: true })
      cleanup(); await pause()
    }
    win.postMessage = originalPostMessage
    win.removeEventListener('error', onWindowError)
    win.removeEventListener('unhandledrejection', onWindowRejection)
    win.console.error = originalWindowError; win.console.warn = originalWindowWarn
    console.error = originalError; console.warn = originalWarn
    readiness = { pass: errors.length === 0 && warnings.length === 0, cases: queries.map(([query]) => query), messages, errors, warnings }
  } finally { console.error = originalError; console.warn = originalWarn; await win.happyDOM.close() }
  const report = { pass: cases.length === (selectedFamily ? 1 : 46) && cases.every(row => row.pass) && readiness?.pass === true, cases, readiness, limitations }
  await writeFile(join(out, 'hydration-report.json'), JSON.stringify(report, null, 2) + '\n')
  assert.equal(report.pass, true, 'One or more shadcn hydration/interaction checks failed; see .verification/hydration-report.json')
} else throw new Error(`Unknown mode: ${mode}`)
