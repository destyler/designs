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
  const roots = () => [...document.querySelectorAll('.rd-menu')]
  const trigger = index => roots()[index]?.querySelector('button')
  const content = index => roots()[index]?.querySelector('[role=menu]')
  const items = index => [...content(index).querySelectorAll('[role=menuitem]')]
  const visible = index => !content(index).hidden
  const highlighted = index => document.getElementById(content(index).getAttribute('aria-activedescendant'))
  const results = () => document.querySelector('[data-results]').textContent.trim()
  const press = (node, key, init = {}) => {
    const event = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
    node.dispatchEvent(event)
    return event.defaultPrevented
  }
  const pointer = (target, type) => target.dispatchEvent(new win.PointerEvent(type, {
    button: 0, pointerType: 'mouse', bubbles: true, clientX: 300, clientY: 300,
  }))
  const settle = () => new Promise(resolve => setTimeout(resolve, 65))
  await waitFor(() => roots().length === 3, 'menus mount')
  assert.equal(trigger(0).textContent.replace('⌄', '').trim(), 'Actions')
  assert.equal(trigger(0).type, 'button')
  assert.equal(trigger(0).getAttribute('aria-haspopup'), 'menu')
  assert.equal(trigger(0).getAttribute('aria-controls'), content(0).id)
  assert.equal(content(0).getAttribute('aria-labelledby'), trigger(0).id)
  assert.equal(trigger(2).disabled, true)
  assert.equal(visible(0), false)
  assert.notEqual(items(0)[0].id, items(1)[0].id, 'public values are scoped across menus')
  trigger(0).focus()
  assert.equal(press(trigger(0), 'ArrowDown'), true)
  await waitFor(() => visible(0) && highlighted(0) === items(0)[0] && document.activeElement === content(0),
    'opens and highlights first action via keyboard')
  assert.equal(items(0)[1].getAttribute('aria-disabled'), 'true')
  assert.equal(press(content(0), 'ArrowDown'), true)
  await waitFor(() => highlighted(0) === items(0)[2], 'skips disabled action')
  assert.equal(press(content(0), 'Home'), true)
  await waitFor(() => highlighted(0) === items(0)[0], 'Home highlights first action')
  assert.equal(press(content(0), 'End'), true)
  await waitFor(() => highlighted(0) === items(0)[2], 'End highlights last action')
  assert.equal(press(content(0), 'Enter'), true)
  await waitFor(() => !visible(0) && document.activeElement === trigger(0), 'keyboard selection closes and restores focus')
  assert.equal(results(), 'open:true|A:archive/it|open:false|')
  trigger(0).click()
  await waitFor(() => visible(0) && document.activeElement === content(0), 'opens from pointer click')
  items(0)[1].click()
  assert.equal(visible(0), true)
  assert.equal(results(), 'open:true|A:archive/it|open:false|open:true|', 'disabled action is ignored')
  pointer(items(0)[0], 'pointermove')
  await waitFor(() => highlighted(0) === items(0)[0], 'pointer highlights action')
  items(0)[2].click()
  await waitFor(() => !visible(0) && document.activeElement === trigger(0), 'no-pointerdown activation selects target not stale highlight')
  assert.equal(results(), 'open:true|A:archive/it|open:false|open:true|A:archive/it|open:false|')
  trigger(0).click()
  await waitFor(() => visible(0) && document.activeElement === content(0), 'opens again')
  await settle()
  assert.equal(press(content(0), 'Escape'), true)
  await waitFor(() => !visible(0) && document.activeElement === trigger(0), 'Escape restores trigger focus')
  trigger(0).click()
  await waitFor(() => visible(0) && document.activeElement === content(0), 'opens for outside focus')
  await settle()
  assert.equal(press(content(0), 'Tab'), false, 'native Tab is not canceled')
  const outside = document.querySelector('#outside')
  outside.focus() // Happy DOM does not implement native Tab traversal.
  await waitFor(() => !visible(0) && document.activeElement === outside, 'outside focus closes without pulling focus back')
  trigger(0).click()
  await waitFor(() => visible(0) && document.activeElement === content(0), 'opens for outside pointer dismissal')
  await settle()
  pointer(outside, 'pointerdown')
  outside.focus()
  await waitFor(() => !visible(0) && document.activeElement === outside, 'outside pointer closes and preserves target focus')
  trigger(0).click()
  await waitFor(() => visible(0) && document.activeElement === content(0), 'opens for pointer-only dismissal')
  await settle()
  pointer(document.querySelector('main'), 'pointerdown') // No focus event masks this dismissal path.
  await waitFor(() => !visible(0) && document.activeElement === trigger(0), 'pointerdown alone dismisses and restores focus')
  trigger(1).focus()
  assert.equal(press(trigger(1), 'ArrowUp'), true)
  await waitFor(() => visible(1) && highlighted(1) === items(1)[2], 'second menu has its own keyboard highlight')
  press(content(1), ' ')
  await waitFor(() => !visible(1) && document.activeElement === trigger(1), 'Space activates only the second menu')
  assert.equal(results().endsWith('|B:archive/it|'), true)
  await win.happyDOM.close()
} else {
  const plugins = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    solid: async () => (await import('vite-plugin-solid')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
  }
  for (const [name, plugin] of Object.entries(plugins)) test(`Ready Menu ${name}: action activation, keyboard, dismissal, focus, scoped IDs`, { timeout: 120_000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-menu-test-'))
    try {
      const { build } = await import('vite')
      const file = join(root, 'test/fixtures/ready-menu', `${name}.${name === 'react' || name === 'solid' ? 'tsx' : 'ts'}`)
      await build({ root, configFile: false, logLevel: 'error', plugins: [await plugin()], build: {
        outDir: folder, minify: false, lib: { entry: file, formats: ['es'], fileName: () => 'client.mjs' },
      } })
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  })
}
