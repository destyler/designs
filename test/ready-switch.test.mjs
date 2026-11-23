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
  const byName = name => document.querySelector(`input[name="${name}"]`)
  await waitFor(() => byName('radios'))
  const { form } = byName('radios')
  const control = name => byName(name).closest('label').querySelector('[data-part="control"]')
  const data = () => Object.fromEntries(new FormData(form))
  for (const name of ['radios', 'fixed', 'disabled', 'consent', 'invalid']) {
    const node = byName(name)
    assert.equal(node.getAttribute('role'), 'switch')
    assert.ok(document.getElementById(node.getAttribute('aria-labelledby'))?.textContent)
  }
  assert.equal(document.getElementById(byName('radios').getAttribute('aria-describedby')).textContent, 'Turns radios off')
  assert.equal(byName('invalid').getAttribute('aria-invalid'), 'true')
  await waitFor(() => byName('invalid').validationMessage === 'Check the setting', 'custom constraint validation')
  assert.equal(byName('disabled').disabled, true)
  assert.equal(byName('consent').validity.valueMissing, true)
  assert.deepEqual(data(), { radios: 'off' })
  byName('radios').click()
  await waitFor(() => !byName('radios').checked && control('radios').dataset.state === 'unchecked')
  assert.deepEqual(data(), {})
  form.reset()
  await waitFor(() => byName('radios').checked && control('radios').dataset.state === 'checked', 'reset restores defaultChecked')
  assert.deepEqual(data(), { radios: 'off' })
  byName('fixed').click()
  await waitFor(() => document.querySelector('[data-proposed]').textContent === 'true')
  assert.equal(byName('fixed').checked, false)
  assert.equal(control('fixed').dataset.state, 'unchecked')
  byName('consent').click()
  await waitFor(() => control('consent').dataset.state === 'checked')
  assert.equal(byName('consent').validity.valueMissing, false)
  assert.deepEqual(data(), { radios: 'off', consent: 'on' })
  await win.happyDOM.close()
} else {
  const plugins = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    solid: async () => (await import('vite-plugin-solid')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
  }
  for (const [name, plugin] of Object.entries(plugins)) test(`Ready Switch ${name}: names, form state, defaults and controlled veto`, { timeout: 120_000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-switch-test-'))
    try {
      const { build } = await import('vite')
      const file = join(root, 'test/fixtures/ready-switch', `${name}.${name === 'react' || name === 'solid' ? 'tsx' : 'ts'}`)
      await build({ root, configFile: false, logLevel: 'error', plugins: [await plugin()], build: {
        outDir: folder, minify: false, lib: { entry: file, formats: ['es'], fileName: () => 'client.mjs' },
      } })
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  })
}
