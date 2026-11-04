/** Verify actual build-time Astro output, without executing JavaScript.
 * Interactive regression coverage lives in test-astro-showcase-browser.mjs.
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Window } from 'happy-dom'
const window = new Window({ settings: { disableCSSFileLoading: true, disableIframePageLoading: true } })
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
try {
  window.document.body.innerHTML = await read('dist/index.html')
  const document = window.document
  assert.match(document.querySelector('meta[name="generator"]').content, /^Astro /)
  assert.equal(document.querySelector('h1').textContent, 'Switch')
  assert.ok(document.querySelector('header.site-header'))
  assert.ok(document.querySelector('aside.sidebar'))
  assert.equal(document.querySelectorAll('astro-island').length, 1)
  assert.equal(document.querySelectorAll('.demo-panel').length, 2)
  assert.equal(document.querySelectorAll('iframe.framework-frame').length, 2)
  assert.ok(document.querySelector('[data-demo="reference"] iframe').src.includes('/reference/'))
  assert.ok(document.querySelector('[data-demo="destyler"] iframe').src.includes('/vanilla-extract/react/'))
  assert.equal(document.querySelectorAll('[aria-label="Source files"] [role="tab"]').length, 6)
  assert.equal(document.querySelector('[data-testid="css-source"]').textContent, await read('examples/vanilla-extract/react/Showcase.tsx'))
  assert.equal(document.querySelector('#code-panel').hidden, true)
  assert.doesNotMatch(document.querySelector('.comparison-grid').textContent, /Notifications|Marketing emails|Settings/)
  document.body.innerHTML = await read('dist/reference/index.html')
  const control = document.querySelector('[role="switch"]')
  assert.ok(control, 'The unmodified shadcn Switch is server-rendered by Astro')
  assert.equal(control.getAttribute('aria-label'), 'Airplane mode')
  assert.equal(control.getAttribute('aria-checked'), 'false')
  assert.equal(document.querySelectorAll('[role="switch"]').length, 1)
  console.log('Astro SSR output passed: static document/shell, hydrated comparison island, fixed reference iframe, exact source code, server-rendered original Switch. Browser coverage is separate.')
} finally { await window.happyDOM.close() }
