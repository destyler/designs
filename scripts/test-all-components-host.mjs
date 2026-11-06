import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { Window } from 'happy-dom'

const root = fileURLToPath(new URL('../', import.meta.url))
const out = join(root, 'artifacts/all-components/host')
await mkdir(out, { recursive: true })
await build({ configFile: false, root, logLevel: 'error', build: { outDir: out, emptyOutDir: false, minify: false, lib: { entry: join(root, 'examples/all-components/gallery.ts'), formats: ['es'], fileName: () => 'gallery.mjs' } } })
const { initializeGallery } = await import(pathToFileURL(join(out, 'gallery.mjs')))
const catalog = JSON.parse(await readFile(join(root, 'examples/all-components/shared/catalog.json'), 'utf8'))
const win = new Window({ url: 'https://designs.example.test/components/', settings: { disableIframePageLoading: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true, disableJavaScriptEvaluation: true } })
const doc = win.document
const report = { browser: false, pass: false, checks: [], limitations: ['Happy DOM does not render CSS or load the real iframe applications. Readiness messages and network responses are simulated. Native focus, keyboard, touch and assistive-technology acceptance remain pending.'] }
let dispose
const frameWindows = []
const pause = () => new Promise(resolve => setTimeout(resolve, 15))
const until = async predicate => {
  const deadline = Date.now() + 3000
  while (!predicate() && Date.now() < deadline) await pause()
  assert.ok(predicate(), 'Expected asynchronous host result within three seconds')
}
const check = (name, action) => { action(); report.checks.push(name) }
try {
  const html = await readFile(join(root, 'dist/components/index.html'), 'utf8')
  doc.write(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ''))
  let copied = ''
  Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: async value => { copied = value } } })
  let fetchCount = 0
  let cssFetchCount = 0
  win.fetch = async input => {
    const url = new URL(String(input), win.location.href)
    assert.equal(url.origin, win.location.origin)
    assert.match(url.pathname, /^\/all-components\/source\/(theme\.css|(?:react|vue|solid|svelte)\/[a-z-]+\.json)$/)
    fetchCount++
    if (url.pathname.endsWith('/theme.css')) cssFetchCount++
    const body = await readFile(join(root, 'public', url.pathname.slice(1)), 'utf8')
    return new Response(body, { status: 200 })
  }
  dispose = initializeGallery(doc, win)
  const cards = [...doc.querySelectorAll('.gallery-card')]
  // Iframe loading is disabled. Give each simulated frame a distinct window identity.
  for (const card of cards) {
    const frameWindow = new Window({ url: card.querySelector('iframe').src, settings: { disableJavaScriptEvaluation: true } })
    frameWindows.push(frameWindow)
    Object.defineProperty(card.querySelector('iframe'), 'contentWindow', { configurable: true, value: frameWindow })
  }
  check('46 navigable families and four independent framework cards', () => {
    assert.equal(doc.querySelectorAll('[data-component]').length, 46)
    assert.equal(cards.length, 4)
    assert.equal(doc.querySelector('#component-title').textContent, 'Checkbox')
    assert.match(doc.title, /^Checkbox/)
  })
  for (const family of catalog.families) {
    win.location.hash = family; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
    for (const card of cards) {
      const frame = new URL(card.querySelector('iframe').src)
      assert.equal(frame.searchParams.get('component'), family)
      assert.equal(frame.searchParams.get('theme'), 'dark')
      assert.equal(frame.pathname, `/all-components/${card.dataset.framework}/`)
    }
    assert.equal(doc.querySelector('[aria-current=page]').dataset.component, family)
  }
  report.checks.push('all 46 selections route to all four matching isolated examples')
  win.location.hash = 'not-a-component'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  check('unknown fragments fall back without arbitrary iframe navigation', () => assert.match(cards[0].querySelector('iframe').src, /component=checkbox/))
  const search = doc.querySelector('#component-search')
  search.value = 'color'; search.dispatchEvent(new win.Event('input'))
  check('component search filters the full catalog', () => assert.deepEqual([...doc.querySelectorAll('[data-component]')].filter(link => !link.hidden).map(link => link.dataset.component), ['color-picker']))
  search.value = 'no-such-example'; search.dispatchEvent(new win.Event('input'))
  check('empty search has an explicit result', () => assert.equal(doc.querySelector('#component-empty').hidden, false))
  search.value = ''; search.dispatchEvent(new win.Event('input'))
  cards[0].querySelector('.gallery-theme-toggle').click()
  check('per-framework theme changes are isolated', () => assert.deepEqual(cards.map(card => card.dataset.theme), ['light', 'dark', 'dark', 'dark']))
  doc.querySelector('[data-all-theme=light]').click()
  check('all-light and all-dark controls reflect actual selection', () => {
    assert.ok(cards.every(card => card.dataset.theme === 'light'))
    assert.equal(doc.querySelector('[data-all-theme=light]').getAttribute('aria-pressed'), 'true')
  })
  for (const card of cards) {
    const frame = card.querySelector('iframe')
    frame.dispatchEvent(new win.Event('load'))
    assert.equal(card.querySelector('.gallery-frame-status').hidden, false, 'An iframe load is not proof the app mounted')
    const ready = { type: 'destyler:all-components-ready', family: 'checkbox', framework: card.dataset.framework, theme: 'light' }
    const send = (data, origin = win.location.origin, source = frame.contentWindow) => win.dispatchEvent(new win.MessageEvent('message', { data, origin, source }))
    send(ready, 'https://untrusted.invalid')
    send(ready, win.location.origin, null)
    send({ ...ready, family: 'dialog' })
    send({ ...ready, theme: 'dark' })
    assert.equal(card.querySelector('.gallery-frame-status').hidden, false)
    send(ready)
    assert.equal(card.querySelector('.gallery-frame-status').hidden, true)
  }
  report.checks.push('ready messages reject foreign origin, wrong source and stale family/theme; plain iframe load stays pending')
  for (const card of cards) {
    const framework = card.dataset.framework
    card.querySelector('[data-view=preview]').dispatchEvent(new win.KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    await until(() => card.querySelector('pre code').textContent.includes('Checkbox'))
    assert.equal(doc.activeElement.id, `${framework}-code-tab`)
    assert.equal(doc.getElementById(`${framework}-preview-panel`).hidden, true)
    assert.equal(doc.getElementById(`${framework}-code-panel`).hidden, false)
    assert.match(card.querySelector('pre code').textContent, /Checkbox/)
    assert.ok(card.querySelectorAll('.gallery-source-select option').length >= 2)
    card.querySelector('.gallery-copy').click(); await until(() => card.querySelector('.gallery-copy-status').textContent === 'Copied source.')
    assert.equal(copied, card.querySelector('pre code').textContent)
    assert.equal(card.querySelector('.gallery-copy-status').textContent, 'Copied source.')
    const files = card.querySelector('.gallery-source-select')
    files.value = String(files.options.length - 1); files.dispatchEvent(new win.Event('change'))
    assert.match(card.querySelector('pre code').textContent, /--demo-neutral/)
    card.querySelector('[data-view=code]').dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    assert.equal(doc.activeElement.id, `${framework}-preview-tab`)
  }
  report.checks.push('four Code tabs expose actual source and shared CSS, simulated copy round-trips, tab keyboard Home/End works')
  assert.equal(cssFetchCount, 1, 'The shared CSS is fetched only once')
  report.sourceRequests = fetchCount
  win.location.hash = 'tree'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  cards[0].querySelector('[data-view=code]').click(); await until(() => [...cards[0].querySelectorAll('option')].some(option => /TreeNode/.test(option.textContent)))
  check('source includes required recursive helpers', () => assert.ok([...cards[0].querySelectorAll('option')].some(option => /TreeNode/.test(option.textContent))))
  const priorFrames = cards.map(card => card.querySelector('iframe').src)
  doc.querySelector('.gallery-skip').click()
  check('skip link moves focus without changing the component route or reloading examples', () => {
    assert.equal(doc.activeElement.id, 'gallery-main')
    assert.equal(win.location.hash, '#tree')
    assert.deepEqual(cards.map(card => card.querySelector('iframe').src), priorFrames)
  })
  const priorTitle = doc.title
  dispose(); dispose = undefined
  win.location.hash = 'slider'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  check('disposal removes listeners and pending timeout work', () => assert.equal(doc.title, priorTitle))
  report.pass = true
} catch (error) { report.error = String(error.stack || error); process.exitCode = 1 }
finally { if (dispose) dispose(); for (const frame of frameWindows) await frame.happyDOM.close(); await win.happyDOM.close(); await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2)) }
