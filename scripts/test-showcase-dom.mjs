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
  assert.equal(document.querySelectorAll('.demo-panel').length, 5)
  assert.equal(document.querySelectorAll('iframe.framework-frame').length, 5)
  const grid = document.querySelector('.comparison-grid')
  assert.equal(grid.dataset.example, 'switch')
  assert.equal(grid.firstElementChild.dataset.demo, 'reference', 'Original reference is above implementations')
  assert.ok(document.querySelector('[data-demo="reference"] iframe').src.includes('/reference/'))
  assert.equal(document.querySelector('[aria-label="Destyler framework"]'), null)
  for (const [name, label, extension] of [['react', 'React', 'tsx'], ['vue', 'Vue', 'vue'], ['solid', 'Solid', 'tsx'], ['svelte', 'Svelte', 'svelte']]) {
    const card = grid.querySelector(`.implementations-grid [data-demo="${name}"]`)
    assert.ok(card, `${name}: simultaneous implementation card`)
    assert.ok(card.querySelector('iframe').src.includes(`/css-only/${name}/`))
    assert.equal(card.querySelectorAll(`[aria-label="${label} source files"] [role="tab"]`).length, 3)
    assert.equal(card.querySelector('[data-testid="css-source"]').textContent, await read(`examples/css-only/${name}/SwitchExample.${extension}`))
    assert.equal(card.querySelector(`#${name}-code-panel`).hidden, true)
    assert.equal(card.querySelector(`#${name}-preview-panel`).hidden, false)
    assert.match(card.querySelector(`#${name}-source-tab-component`).textContent, new RegExp(`SwitchExample.${extension}`))
    assert.match(card.querySelector(`#${name}-source-tab-styles`).textContent, /styles\.ts/)
    assert.match(card.querySelector(`#${name}-source-tab-css`).textContent, /styles.css/)
  }
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id)
  assert.equal(new Set(ids).size, ids.length, 'Every view/source accessibility ID is unique')
  assert.doesNotMatch(document.querySelector('.comparison-grid').textContent, /Notifications|Marketing emails|Settings/)
  document.body.innerHTML = await read('dist/reference/index.html')
  const control = document.querySelector('[role="switch"]')
  assert.ok(control, 'The unmodified shadcn Switch is server-rendered by Astro')
  assert.equal(control.getAttribute('aria-label'), 'Airplane mode')
  assert.equal(control.getAttribute('aria-checked'), 'false')
  assert.equal(document.querySelectorAll('[role="switch"]').length, 1)
  console.log('Astro SSR output passed: static document/shell, hydrated comparison island, top reference and four parallel iframe cards, exact framework source code, server-rendered original Switch. Browser coverage is separate.')
} finally { await window.happyDOM.close() }
