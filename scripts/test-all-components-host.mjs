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
const coverage = JSON.parse(await readFile(join(root, 'examples/all-components/shared/shadcn-coverage.json'), 'utf8'))
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
const sourceResponse = (name, code) => new Response(JSON.stringify({ files: [{ name, code }] }), { status: 200 })
const sourceScenario = async (html, framework, action) => {
  const scenario = new Window({ url: 'https://designs.example.test/components/', settings: { disableIframePageLoading: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true, disableJavaScriptEvaluation: true } })
  let cleanup
  try {
    scenario.document.write(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ''))
    const card = scenario.document.querySelector(`.gallery-card[data-framework=${framework}]`)
    let disposeCount = 0
    const stop = () => { if (!disposeCount++) cleanup?.() }
    cleanup = initializeGallery(scenario.document, scenario)
    await action({ win: scenario, card, stop })
  } finally {
    cleanup?.()
    await scenario.happyDOM.close()
  }
}
const testSourceInterruptions = async html => {
  for (const framework of ['shadcn', 'react']) {
    await sourceScenario(html, framework, async ({ win, card }) => {
      let releaseOld
      let oldConsumed = false
      const stale = new Promise(resolve => { releaseOld = resolve })
      win.fetch = async input => {
        if (String(input).endsWith('/css-only-gallery.json')) return sourceResponse('packages/css-only/styles.css', '/* CSS-only package fixture */')
        if (String(input).endsWith('/theme.css')) return new Response('/* Shared theme fixture */')
        if (String(input).endsWith('/checkbox.json')) return stale
        assert.equal(String(input), `/all-components/source/${framework}/dialog.json`)
        return sourceResponse('Dialog.tsx', '// Current Dialog source')
      }
      card.querySelector('[data-view=code]').click()
      assert.equal(card.querySelector('pre code').textContent, 'Loading source…')
      win.location.hash = 'dialog'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
      await until(() => card.querySelector('pre code').textContent === '// Current Dialog source')
      const currentFiles = [...card.querySelectorAll('option')].map(option => option.textContent)
      releaseOld({ ok: true, json: async () => { oldConsumed = true; return { files: [{ name: 'Checkbox.tsx', code: '// Stale Checkbox source' }] } } })
      await until(() => oldConsumed)
      await pause()
      assert.equal(card.dataset.sourceKey, `${framework}/dialog`)
      assert.equal(card.querySelector('pre code').textContent, '// Current Dialog source')
      assert.deepEqual([...card.querySelectorAll('option')].map(option => option.textContent), currentFiles)
    })
    report.checks.push(`${framework}: an old-family source response cannot overwrite the newly selected family`)
    for (const failure of ['http', 'json', 'schema']) {
      await sourceScenario(html, framework, async ({ win, card }) => {
        let attempts = 0
        win.fetch = async input => {
          if (String(input).endsWith('/css-only-gallery.json')) return sourceResponse('packages/css-only/styles.css', '/* CSS-only package fixture */')
        if (String(input).endsWith('/theme.css')) return new Response('/* Shared theme fixture */')
          assert.equal(String(input), `/all-components/source/${framework}/checkbox.json`)
          if (++attempts === 1) {
            if (failure === 'http') return new Response('Unavailable', { status: 503 })
            if (failure === 'json') return new Response('{ invalid json', { status: 200 })
            return new Response(JSON.stringify({ files: [{ name: 'Broken.tsx', code: null }] }), { status: 200 })
          }
          return sourceResponse('Checkbox.tsx', '// Recovered Checkbox source')
        }
        card.querySelector('[data-view=code]').click()
        await until(() => card.querySelector('pre code').textContent.startsWith('Could not load this example’s source.'))
        assert.equal(card.querySelectorAll('option').length, 0, 'Failed source must not leave selectable stale files')
        if (failure === 'http') assert.match(card.querySelector('pre code').textContent, /503/)
        if (failure === 'schema') assert.match(card.querySelector('pre code').textContent, /Invalid source response/)
        card.querySelector('[data-view=preview]').click()
        card.querySelector('[data-view=code]').click()
        await until(() => card.querySelector('pre code').textContent === '// Recovered Checkbox source')
        assert.equal(attempts, 2, 'The failed result must not be cached')
        assert.deepEqual([...card.querySelectorAll('option')].map(option => option.textContent), ['Checkbox.tsx', ...(framework === 'shadcn' ? [] : ['theme.css'])])
        if (failure === 'http') {
          let rejectedCopies = 0
          Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { rejectedCopies++; throw new Error('Clipboard permission denied') } } })
          card.querySelector('.gallery-copy').click()
          await until(() => card.querySelector('.gallery-copy-status').textContent === 'Copy was unavailable. Select the source text to copy it.')
          assert.equal(rejectedCopies, 1)
          assert.equal(card.querySelector('pre code').textContent, '// Recovered Checkbox source', 'Clipboard rejection must preserve readable source')
        }
      })
      report.checks.push(`${framework}: ${failure} source failure is explicit and retries successfully${failure === 'http' ? '; clipboard rejection keeps source available' : ''}`)
    }
    await sourceScenario(html, framework, async ({ win, card, stop }) => {
      let releaseSource
      let consumed = false
      const pending = new Promise(resolve => { releaseSource = resolve })
      win.fetch = async input => String(input).endsWith('/theme.css') ? new Response('/* Shared theme fixture */') : pending
      card.querySelector('[data-view=code]').click()
      assert.equal(card.querySelector('pre code').textContent, 'Loading source…')
      stop()
      const stoppedHtml = win.document.body.innerHTML
      releaseSource({ ok: true, json: async () => { consumed = true; return { files: [{ name: 'Checkbox.tsx', code: '// Result after disposal' }] } } })
      await until(() => consumed)
      await pause()
      assert.equal(win.document.body.innerHTML, stoppedHtml, 'A completed source request must not mutate the disposed gallery')
      card.querySelector('[data-view=preview]').click()
      assert.equal(win.document.body.innerHTML, stoppedHtml, 'Disposed card listeners must remain detached')
    })
    report.checks.push(`${framework}: disposal during a pending source fetch prevents subsequent DOM updates and tab events`)
  }
}
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
    assert.match(url.pathname, /^\/all-components\/source\/(theme\.css|css-only-gallery\.json|(?:shadcn|react|vue|solid|svelte)\/[a-z-]+\.json)$/)
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
  check('46 navigable families, first full-width shadcn reference and four independent framework cards', () => {
    assert.equal(doc.querySelectorAll('[data-component]').length, 46)
    assert.equal(cards.length, 5)
    assert.deepEqual(cards.map(card => card.dataset.framework), ['shadcn', ...catalog.frameworks])
    assert.equal(cards[0].classList.contains('gallery-card--reference'), true)
    assert.equal(doc.querySelectorAll('iframe').length, 5)
    const ids = [...doc.querySelectorAll('[id]')].map(element => element.id)
    assert.equal(new Set(ids).size, ids.length, 'Every card has unique tab/panel IDs')
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
    assert.equal(doc.querySelector('.gallery-reference-coverage').dataset.coverage, coverage[family].status)
    assert.equal(doc.querySelector('#shadcn-coverage-status').textContent, coverage[family].status)
    assert.equal(doc.querySelector('#shadcn-coverage-explanation').textContent, coverage[family].explanation)
    const sourceLink = doc.querySelector('#shadcn-coverage-source')
    assert.equal(sourceLink.href, coverage[family].sourceUrls[0])
    assert.equal(sourceLink.textContent, coverage[family].status === 'none' ? 'Inspect pinned registry ↗' : 'View pinned source ↗')
    assert.equal(sourceLink.target, '_blank')
    assert.ok(sourceLink.relList.contains('noopener') && sourceLink.relList.contains('noreferrer'))
    assert.ok(coverage[family].explanation.trim(), `${family} explains its reference coverage`)
    assert.ok(['direct', 'composed', 'none'].includes(coverage[family].status))
  }
  report.checks.push('all 46 selections route to all five isolated examples with exact direct/composed/none coverage, explanations and pinned upstream source links')
  const preservedFrames = cards.map(card => card.querySelector('iframe'))
  win.location.hash = '%E0%A4%A'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  check('malformed URL fragments safely use the default family', () => assert.match(cards[0].querySelector('iframe').src, /component=checkbox/))
  win.location.hash = 'not-a-component'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  check('unknown fragments fall back without arbitrary iframe navigation', () => assert.match(cards[0].querySelector('iframe').src, /component=checkbox/))
  const search = doc.querySelector('#component-search')
  search.value = 'color'; search.dispatchEvent(new win.Event('input'))
  check('component search filters the full catalog', () => assert.deepEqual([...doc.querySelectorAll('[data-component]')].filter(link => !link.hidden).map(link => link.dataset.component), ['color-picker']))
  search.value = 'no-such-example'; search.dispatchEvent(new win.Event('input'))
  check('empty search has an explicit result', () => assert.equal(doc.querySelector('#component-empty').hidden, false))
  search.value = ''; search.dispatchEvent(new win.Event('input'))
  cards[0].querySelector('.gallery-theme-toggle').click()
  check('reference theme changes independently from all four frameworks', () => assert.deepEqual(cards.map(card => card.dataset.theme), ['light', 'dark', 'dark', 'dark', 'dark']))
  cards[1].querySelector('.gallery-theme-toggle').click()
  check('a Destyler theme remains independent of the reference and sibling frameworks', () => assert.deepEqual(cards.map(card => card.dataset.theme), ['light', 'light', 'dark', 'dark', 'dark']))
  doc.querySelector('[data-all-theme=dark]').click()
  check('all-dark includes the reference', () => {
    assert.ok(cards.every(card => card.dataset.theme === 'dark'))
    assert.equal(doc.querySelector('[data-all-theme=dark]').getAttribute('aria-pressed'), 'true')
  })
  for (const card of cards) {
    card.querySelector('.gallery-theme-toggle').click()
    assert.equal(card.dataset.theme, 'light')
    assert.ok(cards.filter(other => other !== card).every(other => other.dataset.theme === 'dark'))
    assert.equal(doc.querySelector('[data-all-theme=dark]').getAttribute('aria-pressed'), 'false')
    card.querySelector('.gallery-theme-toggle').click()
  }
  report.checks.push('every card theme is independent and mixed themes clear the global pressed state')
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
    send(ready, win.location.origin, cards.find(other => other !== card).querySelector('iframe').contentWindow)
    send({ ...ready, framework: 'wrong-framework' })
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
    const expected = JSON.parse(await readFile(join(root, 'public/all-components/source', framework, 'checkbox.json'), 'utf8'))
    assert.deepEqual([...card.querySelectorAll('.gallery-source-select option')].map(option => option.textContent), [...expected.files.map(file => file.name), ...(framework === 'shadcn' ? [] : ['theme.css'])])
    assert.equal(card.querySelector('pre code').textContent, expected.files[0].code)
    const fileTabs = card.querySelector('.gallery-file-tabs')
    assert.equal(fileTabs.children.length, expected.files.length + (framework === 'shadcn' ? 0 : 1))
    assert.equal(fileTabs.children[0].getAttribute('aria-selected'), 'true')
    assert.ok(card.querySelector('pre code span[class^=syntax-]'), 'Actual source is highlighted without changing its bytes')
    fileTabs.children[0].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    assert.equal(doc.activeElement.id, `${framework}-file-${fileTabs.children.length - 1}`)
    fileTabs.lastElementChild.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    assert.equal(card.querySelector('pre code').textContent, expected.files[0].code)
    assert.equal(card.querySelector('.gallery-source-path').textContent, expected.files[0].name)
    assert.match(card.querySelector('.gallery-source-link').href, /^https:\/\/github.com\/destyler\/designs\/blob\/rebuild\/all-components-20261106\//)
    if (framework === 'shadcn') assert.equal(cssFetchCount, 0, 'Loading the shadcn reference must not fetch Destyler CSS')
    card.querySelector('.gallery-copy').click(); await until(() => card.querySelector('.gallery-copy-status').textContent === 'Copied source.')
    assert.equal(copied, card.querySelector('pre code').textContent)
    assert.equal(card.querySelector('.gallery-copy-status').textContent, 'Copied source.')
    const files = card.querySelector('.gallery-source-select')
    files.value = String(files.options.length - 1); files.dispatchEvent(new win.Event('change'))
    if (framework === 'shadcn') {
      assert.equal(card.querySelector('pre code').textContent, expected.files.at(-1).code)
      assert.doesNotMatch(card.querySelector('pre code').textContent, /--demo-neutral/)
    } else assert.match(card.querySelector('pre code').textContent, /--demo-neutral/)
    card.querySelector('[data-view=code]').dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    assert.equal(doc.activeElement.id, `${framework}-preview-tab`)
    const frame = card.querySelector('iframe')
    const beforeToggle = frame.src
    card.querySelector('[data-view=preview]').dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    assert.equal(doc.activeElement.id, `${framework}-code-tab`)
    card.querySelector('[data-view=code]').dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    assert.equal(doc.activeElement.id, `${framework}-preview-tab`)
    assert.equal(card.querySelector('iframe'), frame, 'Code/Preview must preserve the mounted frame')
    assert.equal(frame.src, beforeToggle, 'Code/Preview must not reload the example')
  }
  report.checks.push('all five Code tabs expose exact source and simulated copy; shadcn excludes Destyler shared CSS; tab keyboard Arrow/Home/End works without remounting frames')
  assert.equal(cssFetchCount, 1, 'The shared CSS is fetched only once')
  report.sourceRequests = fetchCount
  win.location.hash = 'tree'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  const reactCard = cards.find(card => card.dataset.framework === 'react')
  reactCard.querySelector('[data-view=code]').click(); await until(() => [...reactCard.querySelectorAll('option')].some(option => /TreeNode/.test(option.textContent)))
  check('source includes required recursive helpers', () => assert.ok([...reactCard.querySelectorAll('option')].some(option => /TreeNode/.test(option.textContent))))
  for (const family of ['switch', 'dialog']) {
    win.location.hash = family; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
    reactCard.querySelector('[data-view=code]').click()
    await until(() => !reactCard.querySelector('pre code').textContent.includes('Loading source') && [...reactCard.querySelectorAll('option')].some(option => option.textContent === 'packages/css-only/styles.css'))
    const files = reactCard.querySelector('.gallery-source-select')
    assert.ok(![...files.options].some(option => option.textContent === 'theme.css'))
    files.value = String(files.options.length - 1); files.dispatchEvent(new win.Event('change'))
    assert.equal(reactCard.querySelector('pre code').textContent, await readFile(join(root, 'packages/css-only/styles.css'), 'utf8'))
    assert.ok(reactCard.querySelector('.gallery-source-link').href.endsWith('/packages/css-only/styles.css'))
  }
  report.checks.push('Switch/Dialog Code view shows the exact reused package and no inactive Basic theme')
  const absentFamily = catalog.families.find(family => coverage[family].status === 'none')
  assert.ok(absentFamily, 'Reference gaps must be explicit')
  win.location.hash = absentFamily; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  check('missing shadcn equivalent is labeled none while all four real implementations remain present', () => {
    assert.equal(doc.querySelector('#shadcn-coverage-status').textContent, 'none')
    assert.equal(doc.querySelector('#shadcn-coverage-explanation').textContent, coverage[absentFamily].explanation)
    assert.equal(cards.length, 5)
    assert.ok(cards.every(card => !card.hidden))
  })
  win.location.hash = 'tree'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  const priorFrames = cards.map(card => card.querySelector('iframe').src)
  doc.querySelector('.gallery-skip').click()
  check('skip link moves focus without changing the component route or reloading examples', () => {
    assert.equal(doc.activeElement.id, 'gallery-main')
    assert.equal(win.location.hash, '#tree')
    assert.deepEqual(cards.map(card => card.querySelector('iframe').src), priorFrames)
    assert.ok(cards.every((card, index) => card.querySelector('iframe') === preservedFrames[index]))
  })
  const priorTitle = doc.title
  dispose(); dispose = undefined
  win.location.hash = 'slider'; win.dispatchEvent(new win.HashChangeEvent('hashchange'))
  check('disposal removes listeners and pending timeout work', () => assert.equal(doc.title, priorTitle))
  await testSourceInterruptions(html)
  report.pass = true
} catch (error) { report.error = String(error.stack || error); process.exitCode = 1 }
finally { if (dispose) dispose(); for (const frame of frameWindows) await frame.happyDOM.close(); await win.happyDOM.close(); await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2)) }
