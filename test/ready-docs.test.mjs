// Real documentation App and Ready components in Happy DOM; no browser or CSS geometry claim.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))

if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/ready/' })
  for (const key of Object.getOwnPropertyNames(win)) if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
    try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const target = document.createElement('div'); target.id = 'docs-test'; document.body.append(target)
  const { mountReadyDocs } = await import(pathToFileURL(process.argv[3]))
  const app = mountReadyDocs(target)
  const settle = () => new Promise(resolve => setTimeout(resolve, 100))
  await settle()
  const button = (text, scope = document) => [...scope.querySelectorAll('button')].find(node => node.textContent.trim() === text)
  const part = (family, name) => document.querySelector(`[data-scope="${family}"][data-part="${name}"]`)
  const click = async node => { assert.ok(node, 'Expected actionable element'); node.click(); await settle() }
  const associations = () => {
    for (const node of document.querySelectorAll('[aria-labelledby],[aria-describedby]')) for (const attribute of ['aria-labelledby', 'aria-describedby']) for (const id of (node.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) assert.ok(document.getElementById(id), `${attribute} target ${id} exists`)
  }
  for (const anchor of document.querySelectorAll('a[href^="#"]')) assert.ok(document.getElementById(anchor.getAttribute('href').slice(1)), 'Navigation points to an existing section')
  const toggle = document.querySelector('button[aria-label="打开导航"]')
  await click(toggle); assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.ok(document.querySelector('.sidebar').classList.contains('is-open'))
  await click(document.querySelector('nav a[href="#select"]')); assert.equal(toggle.getAttribute('aria-expanded'), 'false'); assert.equal(document.querySelector('.sidebar').classList.contains('is-open'), false)

  // Framework switching changes real copyable code, not the live renderer.
  for (const framework of ['Vue', 'Solid', 'Svelte', 'React']) {
    await click(button(framework, document.querySelector('#installation')))
    for (const section of ['checkbox', 'select', 'dialog']) {
      const scope = document.getElementById(section)
      assert.match(scope.querySelector('pre code').textContent, new RegExp(`@destyler/ready-prototype/${framework.toLowerCase()}`))
      assert.equal(button(framework, scope).getAttribute('aria-pressed'), 'true')
      assert.match(scope.querySelector('.preview-footer').textContent, /React/)
      const table = scope.querySelector('table').textContent
      const prop = {checkbox:'checked',select:'value',dialog:'open'}[section]
      const event = {checkbox:'Checked',select:'Value',dialog:'Open'}[section]
      if (framework === 'Vue') { assert.ok(table.includes(`update:${prop}`)); assert.ok(table.includes(`${prop}Change`)); assert.ok(!table.includes(`on${event}Change`)) }
      else assert.ok(table.includes(`on${event}Change`))
      assert.match(scope.querySelector('.usage-panel .api-note').textContent, /非受控/)

    }
    assert.match(document.querySelector('#installation pre code').textContent, new RegExp(`framework=${framework.toLowerCase()}`))
  }

  let written, finishCopy
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => { written = text; return new Promise(resolve => { finishCopy = resolve }) } } })
  const copy = document.querySelector('#checkbox button[aria-label^="复制"]')
  copy.click(); await settle(); assert.equal(copy.textContent, '复制代码 ↗', 'Success waits for clipboard resolution')
  assert.equal(written, document.querySelector('#checkbox pre code').textContent)
  finishCopy(); await settle(); assert.equal(copy.textContent, '已复制 ✓')
  await click(button('Vue', document.getElementById('checkbox'))); assert.equal(copy.textContent, '复制代码 ↗', 'New code resets stale copy feedback')
  // A pending clipboard response must not annotate a newer framework snippet.
  copy.click(); await settle()
  await click(button('Solid', document.getElementById('checkbox')))
  finishCopy(); await settle(); assert.equal(copy.textContent, '复制代码 ↗', 'Old completion is ignored after framework change')
  // Repeated copies use only the newest response, including out-of-order rejection.
  const pending = []
  navigator.clipboard.writeText = () => new Promise((resolve,reject) => pending.push({resolve,reject}))
  copy.click(); copy.click(); await settle()
  pending[1].resolve(); await settle(); assert.equal(copy.textContent, '已复制 ✓')
  pending[0].reject(new Error('stale failure')); await settle(); assert.equal(copy.textContent, '已复制 ✓')
  navigator.clipboard.writeText = async () => { throw new Error('Clipboard denied in simulated test') }
  await click(copy); assert.match(copy.textContent, /复制失败/)
  assert.match(document.querySelector('#checkbox [role="status"]').textContent, /无法访问剪贴板/)

  const checkboxSection = document.getElementById('checkbox')
  const inputs = checkboxSection.querySelectorAll('input[type="checkbox"]')
  assert.equal(inputs.length, 2); assert.equal(inputs[0].checked, false); assert.equal(inputs[1].disabled, true)
  await click(checkboxSection.querySelector('.state-toggle'))
  assert.match(checkboxSection.textContent, /请先确认此选项/)
  await click(inputs[0]); assert.equal(inputs[0].checked, true)
  assert.equal(checkboxSection.querySelector('.preview-result code').textContent, 'true')
  assert.equal(checkboxSection.querySelector('.rd-error'), null)
  await click(inputs[1]); assert.equal(inputs[1].checked, false)

  const selectSection = document.getElementById('select')
  const select = part('select', 'trigger')
  await click(select); assert.equal(select.getAttribute('aria-expanded'), 'true')
  const option = value => document.querySelector(`[data-scope="select"][data-part="item"][data-value="${value}"]`)
  assert.equal(option('enterprise').getAttribute('aria-disabled'), 'true')
  await click(option('enterprise')); assert.equal(selectSection.querySelector('.preview-result code').textContent, '""')
  await click(option('studio')); assert.equal(selectSection.querySelector('.preview-result code').textContent, '"studio"')
  assert.equal(select.getAttribute('aria-expanded'), 'false'); assert.equal(selectSection.querySelector('select').value, 'studio')
  assert.equal(selectSection.querySelector('.rd-error'), null)

  for (const theme of ['midnight', 'default']) {
    await click(button(theme === 'midnight' ? 'Midnight' : 'Everyday', document.querySelector('.theme-switch')))
    assert.deepEqual([...document.querySelectorAll('.preview-panel')].map(node => node.dataset.rdTheme), [theme, theme, theme])
    assert.equal(inputs[0].checked, true); assert.equal(selectSection.querySelector('select').value, 'studio')
    await click(part('dialog', 'trigger'))
    const content = part('dialog', 'content'); assert.ok(content); assert.equal(content.getAttribute('role'), 'dialog'); assert.equal(content.getAttribute('aria-modal'), 'true')
    assert.equal(content.closest('[data-rd-theme]').dataset.rdTheme, theme, 'Dialog retains preview theme scope')
    assert.match(document.getElementById(content.getAttribute('aria-labelledby')).textContent, /让工作空间更像你/)
    associations()
    await click(part('dialog', 'close-trigger')); assert.equal(part('dialog', 'trigger').getAttribute('aria-expanded'), 'false')
  }
  await click(part('dialog', 'trigger'))
  part('dialog', 'content').dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  await settle(); assert.equal(part('dialog', 'trigger').getAttribute('aria-expanded'), 'false')
  await app.unmount(); await win.happyDOM.close()
  console.log('PASS ready docs navigation, framework code, copy, theme, Checkbox, Select and Dialog')
} else {
  test('Ready documentation mounts actual components and supports its advertised controls', { timeout: 120000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-docs-test-'))
    try {
      const entry = join(folder, 'entry.mjs')
      await writeFile(entry, `export { mountReadyDocs } from '${root}examples/ready-docs/main.tsx';`)
      const { build } = await import('vite'); const react = (await import('@vitejs/plugin-react')).default
      await build({ root, configFile: false, logLevel: 'error', plugins: [react()], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'docs.mjs' } } })
      const output = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/docs.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.match(output, /PASS ready docs navigation/)
    } finally { await rm(folder, { recursive: true, force: true }) }
  })
  test('Ready documentation snippets preserve the private package and framework contract', async () => {
    const { snippet, install, frameworks, themeSnippets } = await import('../examples/ready-docs/content.ts')
    for (const framework of frameworks) {
      const commands = install(framework)
      assert.match(commands, /npm pack \.\/packages\/ready/)
      assert.match(commands, /scripts\/create-ready-consumer\.mjs/)
      assert.match(commands, /npm install[\s\S]*npm run dev/)
      assert.ok(commands.split('\n').length > 5)
      for (const component of ['Checkbox', 'Select', 'Dialog']) {
        const code = snippet(framework, component)
        assert.ok(code.includes(`@destyler/ready-prototype/${framework.toLowerCase()}`))
        assert.ok(code.includes(`<${component}`)); assert.ok(code.includes('\n'))
        if (framework === 'Svelte') assert.doesNotMatch(code, /bind:(checked|value|open)/)
      }
    }
    assert.equal(themeSnippets.length, 3)
    assert.match(themeSnippets[0].code, /^import /)
    assert.doesNotMatch(themeSnippets[0].code, /<main|--rd-accent/)
    assert.match(themeSnippets[1].code, /\[data-rd-theme\]\.my-theme/)
    assert.doesNotMatch(themeSnippets[1].code, /import |<main/)
    assert.match(themeSnippets[2].code, /id="app"/)
    assert.doesNotMatch(themeSnippets[2].code, /className|import /)
    const source = await readFile(join(root, 'examples/ready-docs/main.tsx'), 'utf8')
    assert.match(source, /22\.22\.3/)
    assert.match(source, /app.config.idPrefix/)
    assert.match(source, /水合前.*丢失或错配/)
    assert.match(source, /Escape.*同时关闭两层/)
    assert.match(source, /packages\/ready\/theme\.css/)
  })

  test('Ready docs picker text meets normal-text contrast in each state', async () => {
    const css = await readFile(join(root, 'examples/ready-docs/styles.css'), 'utf8')
    assert.match(css, /\.frameworks button,\.theme-switch button\{color:#53634b\}/)
    const luminance = hex => {
      const rgb = hex.replace('#','').match(/../g).map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4)
      return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722
    }
    for (const [foreground, background] of [['#53634b','#eaf0e5'],['#53634b','#edf1e8'],['#2c4e35','#ffffff'],['#2d4d35','#ffffff'],['#224a32','#eaf0e5'],['#224a32','#edf1e8']]) {
      assert.ok(css.includes(foreground)); const levels = [luminance(foreground), luminance(background)].sort((a,b)=>b-a)
      assert.ok((levels[0]+.05)/(levels[1]+.05) >= 4.5, `${foreground} on ${background}`)
    }
    assert.match(css, /button:focus-visible[^}]+outline:3px/)
  })
}
