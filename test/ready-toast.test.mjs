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
  const region = () => document.querySelector('[data-scope=toast][data-part=group]')
  const roots = () => [...(region()?.querySelectorAll('[data-scope=toast][data-part=root]') ?? [])]
  const notice = title => roots().find(node => node.querySelector('[data-part=title]').textContent.trim() === title)
  const close = title => notice(title)?.querySelector('button')
  const outside = () => document.querySelector('#outside')
  const key = (target, code, init = {}) => {
    const event = new win.KeyboardEvent('keydown', { key: code, code, bubbles: true, cancelable: true, ...init })
    target.dispatchEvent(event)
    return event.defaultPrevented
  }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const { controller, unused, beforeMount, unmount } = window.toastFixture
  await waitFor(() => region(), 'actual Toaster mounts an empty region')
  await sleep(30) // Wait for host effect and the real Toaster to be active.
  assert.equal(beforeMount, undefined)
  assert.equal(unused.show({ title: 'No host' }), undefined)
  assert.equal(region().getAttribute('role'), 'region')
  assert.equal(region().getAttribute('aria-label'), 'Activity')
  assert.equal(region().getAttribute('aria-live'), 'polite')
  assert.equal(roots().length, 0)
  for (const duration of [Infinity, 2 ** 31, 999, NaN, 1000.5, 30_001]) {
    assert.throws(() => controller.show({ title: 'Invalid timer', duration }), /duration/)
  }
  assert.throws(() => controller.show({ title: ' ' }), /title/)
  const first = controller.show({ title: 'Saved', description: 'Changes are on this device', tone: 'success', duration: 10_000 })
  assert.equal(typeof first, 'string')
  await waitFor(() => notice('Saved'), 'shows accepted status through the real primitive')
  assert.equal(notice('Saved').getAttribute('role'), 'group')
  assert.equal(notice('Saved').getAttribute('data-type'), 'success')
  assert.equal(document.getElementById(notice('Saved').getAttribute('aria-labelledby')).textContent.trim(), 'Saved')
  assert.equal(document.getElementById(notice('Saved').getAttribute('aria-describedby')).textContent.trim(), 'Changes are on this device')
  assert.equal(close('Saved').getAttribute('aria-label'), 'Dismiss Saved')
  assert.equal(close('Saved').type, 'button')
  assert.equal(notice('Saved').querySelector('[data-part=action-trigger]'), null)
  outside().focus()
  assert.equal(key(outside(), 'KeyT', { altKey: true }), false)
  assert.equal(key(outside(), 'Escape'), false)
  await sleep(25)
  assert.equal(document.activeElement, outside(), 'no document shortcut steals focus')
  assert.ok(notice('Saved'), 'outside Escape does not dismiss a notice')
  unused.dismiss(first)
  assert.ok(notice('Saved'), 'another controller cannot mutate this host')
  close('Saved').focus()
  close('Saved').click()
  await waitFor(() => !notice('Saved'), 'close trigger dismisses automatically')
  assert.equal(document.activeElement, outside(), 'manual dismissal restores local focus')
  controller.show({ title: 'Escapable', duration: 10_000 })
  await waitFor(() => notice('Escapable'))
  close('Escapable').focus()
  assert.equal(key(close('Escapable'), 'Escape'), true)
  await waitFor(() => !notice('Escapable'), 'Escape inside dismisses the focused notice')
  assert.equal(document.activeElement, outside())
  controller.show({ title: 'Timed', duration: 1000 })
  await waitFor(() => notice('Timed'))
  close('Timed').focus()
  assert.equal(document.activeElement, close('Timed'))
  await sleep(1110)
  assert.ok(notice('Timed'), 'focused notice does not expire')
  document.querySelector('#after').focus()
  assert.equal(document.activeElement.id, 'after', 'leaving notice does not pull focus back')
  for (let attempts = 0; attempts < 30 && notice('Timed'); attempts++) await sleep(50)
  assert.equal(notice('Timed'), undefined, 'timer expires after focus leaves')
  assert.equal(document.activeElement.id, 'after')
  const active = ['One', 'Two', 'Three'].map(title => controller.show({ title, duration: 10_000 }))
  assert.ok(active.every(id => typeof id === 'string'))
  assert.equal(controller.show({ title: 'Overflow' }), undefined)
  await waitFor(() => roots().length === 3, 'at most three notices render')
  controller.dismiss(undefined) // Unchecked JS must not accidentally call upstream dismiss-all.
  await sleep(25)
  assert.equal(roots().length, 3)
  controller.dismiss(active[1])
  await waitFor(() => !notice('Two') && roots().length === 2, 'manual controller dismissal operates on one ID')
  assert.equal(notice('Overflow'), undefined, 'overflow was neither created nor queued')
  unmount()
  await waitFor(() => !region(), 'host removed')
  assert.equal(controller.show({ title: 'After unmount' }), undefined, 'host unregisters on unmount')
  await win.happyDOM.close()
} else {
  const plugins = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    solid: async () => (await import('vite-plugin-solid')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
  }
  for (const [name, plugin] of Object.entries(plugins)) test(`Ready Toast ${name}: scoped controller, bounded timers, live markup and dismissal`, { timeout: 120_000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-toast-test-'))
    try {
      const { build } = await import('vite')
      const file = join(root, 'test/fixtures/ready-toast', `${name}.${name === 'react' || name === 'solid' ? 'tsx' : 'ts'}`)
      await build({ root, configFile: false, logLevel: 'error', plugins: [await plugin()], build: {
        outDir: folder, minify: false, lib: { entry: file, formats: ['es'], fileName: () => 'client.mjs' },
      } })
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  })
}
