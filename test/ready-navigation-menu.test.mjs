import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const waitFor = async (fn, message) => {
  for (let i = 0; i < 40; i++) {
    if (fn()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.ok(fn(), message)
}

if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (/^(window|document|navigator|HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|FormData)$/.test(key)) {
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] })
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  document.body.innerHTML = '<div id="app"></div>'
  await import(pathToFileURL(process.argv[3]))
  const nav = () => document.querySelector('nav[aria-label="Main navigation"]')
  const trigger = key => nav().querySelector(`button[data-value="${key}"]`)
  const anchor = hash => nav().querySelector(`a[href="${hash}"]`)
  const panel = key => document.getElementById(trigger(key).getAttribute('aria-controls'))
  const expanded = key => trigger(key).getAttribute('aria-expanded') === 'true'
  const output = () => document.querySelector('[data-values]').textContent.trim()
  const press = (node, key) => {
    const event = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    node.dispatchEvent(event)
    return event.defaultPrevented
  }
  await waitFor(() => nav(), 'real nav landmark mounts')
  assert.equal(nav().querySelector('[data-part=list]').getAttribute('role'), 'list')
  assert.equal(nav().querySelector('[role=menubar]'), null)
  assert.equal(nav().querySelectorAll('[data-part=item][role=listitem]').length, 4)
  assert.equal(anchor('#home').getAttribute('aria-current'), 'page')
  assert.equal(trigger('locked').disabled, true)
  assert.equal(trigger('products').type, 'button')
  assert.equal(expanded('products'), false)
  assert.equal(panel('products').hidden, true, 'closed panel stays mounted for aria-controls')
  assert.equal(panel('docs').hidden, true)
  trigger('products').dispatchEvent(new win.PointerEvent('pointerenter', { pointerType: 'mouse' }))
  trigger('products').dispatchEvent(new win.PointerEvent('pointerover', { pointerType: 'mouse', bubbles: true }))
  await new Promise(resolve => setTimeout(resolve, 250))
  assert.equal(expanded('products'), false, 'mouse hover is deliberately disabled')
  assert.equal(output(), '')
  trigger('products').focus()
  assert.equal(press(trigger('products'), 'Enter'), true)
  await waitFor(() => expanded('products') && !panel('products').hidden, 'Enter opens first disclosure')
  assert.equal(output(), 'products|')
  assert.equal(document.activeElement, trigger('products'))
  const desktop = anchor('#desktop')
  assert.equal(press(trigger('products'), 'ArrowUp'), true)
  await waitFor(() => document.activeElement === anchor('#mobile'), 'Up enters already-open disclosure at last link')
  assert.equal(expanded('products'), true)
  trigger('products').focus()
  assert.equal(press(trigger('products'), 'ArrowDown'), true)
  await waitFor(() => document.activeElement === desktop, 'Down enters already-open disclosure at first link')
  assert.equal(document.activeElement, desktop)
  assert.equal(press(desktop, 'Home'), false, 'native link does not commit a menubar key')
  assert.equal(document.activeElement, desktop)
  assert.equal(press(desktop, 'Escape'), true)
  await waitFor(() => !expanded('products') && panel('products').hidden, 'Escape closes disclosure from its panel')
  assert.equal(document.activeElement, trigger('products'), 'Escape restores trigger focus')
  assert.equal(output(), 'products|closed|')
  assert.equal(press(trigger('products'), 'ArrowRight'), true)
  await waitFor(() => document.activeElement === trigger('docs'), 'ArrowRight skips disabled trigger')
  assert.equal(press(trigger('docs'), 'Home'), true)
  await waitFor(() => document.activeElement === trigger('products'), 'Home focuses first enabled disclosure')
  assert.equal(press(trigger('products'), 'End'), true)
  await waitFor(() => document.activeElement === trigger('docs'), 'End focuses last enabled disclosure')
  assert.equal(press(trigger('docs'), ' '), true)
  await waitFor(() => expanded('docs') && !panel('docs').hidden, 'Space opens second disclosure')
  const guide = anchor('#guide')
  assert.equal(guide.getAttribute('aria-current'), 'page')
  guide.focus()
  assert.equal(press(guide, 'Enter'), false, 'native Enter activation must not be prevented')
  const modified = new win.MouseEvent('click', { button: 0, ctrlKey: true, bubbles: true, cancelable: true })
  guide.dispatchEvent(modified)
  assert.equal(modified.defaultPrevented, false)
  assert.equal(expanded('docs'), true, 'modified activation does not close the disclosure')
  window.history.replaceState(null, '', '#home')
  const outside = document.querySelector('#outside')
  outside.focus()
  await waitFor(() => !expanded('docs') && panel('docs').hidden, 'focus leaving nav closes it')
  assert.equal(document.activeElement, outside, 'focus-out does not pull focus back')
  trigger('docs').focus()
  assert.equal(press(trigger('docs'), 'ArrowDown'), true)
  await waitFor(() => expanded('docs') && document.activeElement === guide, 'Down opens closed disclosure and enters links')
  press(guide, 'Escape')
  await waitFor(() => !expanded('docs'), 'Escape closes ArrowDown-opened disclosure')
  trigger('docs').click()
  await waitFor(() => expanded('docs') && !panel('docs').hidden, 'pointer opening also works')
  guide.focus()
  guide.click()
  await waitFor(() => !expanded('docs') && panel('docs').hidden, 'activation closes the disclosure')
  assert.equal(window.location.hash, '#guide', 'native fragment navigation occurred')
  assert.equal(output(), 'products|closed|docs|closed|docs|closed|docs|closed|')
  await win.happyDOM.close()
} else {
  const plugins = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    solid: async () => (await import('vite-plugin-solid')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
  }
  for (const [name, plugin] of Object.entries(plugins)) test(`Ready NavigationMenu ${name}: disclosure state, real anchors, keyboard, and focus`, { timeout: 120_000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-navigation-menu-test-'))
    try {
      const { build } = await import('vite')
      const file = join(root, 'test/fixtures/ready-navigation-menu', `${name}.${name === 'react' || name === 'solid' ? 'tsx' : 'ts'}`)
      await build({ root, configFile: false, logLevel: 'error', plugins: [await plugin()], build: {
        outDir: folder, minify: false, lib: { entry: file, formats: ['es'], fileName: () => 'client.mjs' },
      } })
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  })
}
