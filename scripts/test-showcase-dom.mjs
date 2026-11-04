/** Production-shell DOM regression, not browser rendering/focus-trap proof. Run after npm run build. */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Window } from 'happy-dom'
const window = new Window({ url: 'http://localhost:4173/', settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true, disableIframePageLoading: true } })
for (const key of Object.getOwnPropertyNames(window)) {
  if (['window', 'document', 'navigator', 'location', 'parent'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|DocumentFragment|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|KeyboardEvent|MessageEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: window[key] })
  }
}
for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = window[key].bind(window)
globalThis.window = window
const errors = [], originalError = console.error
console.error = (...args) => errors.push(args.map(String).join(' '))
const settle = () => new Promise(resolve => setTimeout(resolve, 60))
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const change = async (element, value) => { element.value = value; element.dispatchEvent(new window.Event('change', { bubbles: true })); await settle() }
try {
  document.body.innerHTML = '<div id="app"></div>'
  const html = await read('dist/index.html')
  const entry = [...html.matchAll(/src="(\/assets\/[^\"]+\.js)"/g)].at(-1)?.[1]
  assert.ok(entry, 'Build the production site first')
  await import(new URL('../dist' + entry, import.meta.url)); await settle()
  const reference = document.querySelector('[data-demo="reference"]')
  assert.ok(reference, 'Fixed original reference mounts')
  const switchControls = reference.querySelectorAll('[role="switch"]')
  assert.equal(switchControls.length, 3)
  const marketing = switchControls[1]
  assert.equal(marketing.getAttribute('aria-checked'), 'false')
  marketing.click(); await settle()
  assert.equal(marketing.getAttribute('aria-checked'), 'true', 'Real reference control changes state')
  document.querySelector('[aria-label="Toggle shadcn/ui color mode"]').click(); await settle()
  const referenceSurface = reference.querySelector('.demo-surface')
  assert.ok(referenceSurface.classList.contains('dark'))
  const framework = document.querySelector('[aria-label="Destyler framework"]')
  assert.deepEqual([...framework.options].map(option => option.value), ['react', 'vue', 'solid', 'svelte'])
  const preview = document.getElementById('preview-tab'), code = document.getElementById('code-tab')
  const preserved = () => {
    assert.equal(document.querySelector('[data-demo="reference"]'), reference, 'Reference panel instance is stable')
    assert.equal(reference.querySelectorAll('[role="switch"]')[1], marketing, 'Reference primitive instance is stable')
    assert.equal(marketing.getAttribute('aria-checked'), 'true', 'Reference state survives right-side changes')
    assert.ok(referenceSurface.classList.contains('dark'), 'Reference theme survives right-side changes')
    assert.equal(reference.closest('[hidden]'), null, 'Reference is never hidden by right-side code')
  }
  for (const name of ['react', 'vue', 'solid', 'svelte', 'react']) {
    await change(framework, name)
    const iframe = document.querySelector('iframe.framework-frame')
    assert.equal(document.querySelectorAll('iframe.framework-frame').length, 1)
    assert.match(iframe.src, new RegExp(`/vanilla-extract/${name}/\\?showcase=1&component=switch&theme=light`))
    assert.equal(document.querySelector('[data-demo="destyler"]').dataset.framework, name)
    code.click(); await settle()
    assert.equal(document.getElementById('preview-panel').hidden, true)
    assert.equal(document.getElementById('code-panel').hidden, false)
    assert.equal(document.querySelector('iframe.framework-frame'), iframe, 'Code keeps live preview mounted')
    const extension = name === 'vue' ? 'vue' : name === 'svelte' ? 'svelte' : 'tsx'
    assert.equal(document.querySelector('[data-testid="css-source"]').textContent, await read(`examples/vanilla-extract/${name}/Showcase.${extension}`), `${name}: displayed code is exact live source`)
    const file = document.querySelector('#source-file')
    for (const [value, path] of [['css','packages/vanilla-extract/dist/styles.css'],['styles','packages/vanilla-extract/src/styles.css.ts'],['shared','examples/vanilla-extract/shared/showcase.ts'],['layout','examples/vanilla-extract/shared/showcase.css']]) {
      await change(file, value)
      assert.equal(document.querySelector('[data-testid="css-source"]').textContent, await read(path), `${name}: ${value} matches exact file bytes`)
    }
    preserved()
    preview.click(); await settle()
    assert.equal(document.getElementById('preview-panel').hidden, false)
    assert.equal(document.getElementById('code-panel').hidden, true)
    assert.equal(document.querySelector('iframe.framework-frame'), iframe)
    preserved()
  }
  for (const [from, key, to] of [[preview,'ArrowRight',code],[code,'ArrowLeft',preview],[preview,'End',code],[code,'Home',preview],[preview,'ArrowLeft',code],[code,'ArrowRight',preview]]) {
    from.focus(); from.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); await settle()
    assert.equal(to.getAttribute('aria-selected'), 'true', `${key} changes selected tab`)
    assert.equal(document.activeElement, to, `${key} moves DOM focus`)
    assert.equal(to.tabIndex, 0); assert.equal(from.tabIndex, -1)
    assert.equal(document.getElementById('preview-panel').hidden, to === code)
    assert.equal(document.getElementById('code-panel').hidden, to !== code)
    preserved()
  }
  code.click(); await settle()
  for (const name of ['vue', 'solid', 'svelte', 'react']) {
    await change(framework, name)
    const extension = name === 'vue' ? 'vue' : name === 'svelte' ? 'svelte' : 'tsx'
    assert.equal(document.getElementById('preview-panel').hidden, true, 'Framework selection preserves the chosen Code view')
    assert.equal(document.querySelector('[data-testid="css-source"]').textContent, await read(`examples/vanilla-extract/${name}/Showcase.${extension}`), `${name}: changing framework while Code is open refreshes exact source`)
    preserved()
  }
  preview.click(); await settle()
  document.querySelector('[aria-label="Toggle Destyler color mode"]').click(); await settle()
  preserved()
  assert.ok(document.querySelector('.framework-preview').classList.contains('dark'), 'Right theme can be changed independently')
  const nav = [...document.querySelectorAll('nav[aria-label="Examples"] a')]
  assert.deepEqual(nav.map(link => link.getAttribute('href')), ['#switch', '#dialog'], 'Only implemented components are offered')
  window.location.hash = '#dialog'; await settle()
  assert.equal(document.querySelector('h1').textContent, 'Dialog')
  assert.match(reference.textContent, /Review preferences/)
  window.location.hash = ''; await settle()
  assert.equal(document.querySelector('h1').textContent, 'Switch', 'Returning to empty hash restores the default component')
  assert.equal(reference.querySelectorAll('[role="switch"]').length, 3)
  assert.equal(document.querySelectorAll('.demo-panel').length, 2)
  assert.deepEqual(errors, [], 'No console errors')
  console.log('Unified showcase DOM passed: fixed reference state/theme/node identity, four real preview routes, exact source files, exclusive right tabs, tab key handlers, hash navigation, scoped component list. Not visual, frame-runtime, focus-trap, or touch proof.')
} finally { console.error = originalError; await window.happyDOM.close() }
