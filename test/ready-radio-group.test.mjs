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
  const group = name => Array.from(document.querySelectorAll('[role="radiogroup"]'))
    .find(node => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent.trim() === name)
  const option = (name, value) => group(name)?.querySelector(`input[value="${value}"]`)
  const control = (name, value) => option(name, value).closest('label').querySelector('[data-part="item-control"]')
  await waitFor(() => option('Schedule', 'daily'), 'named radio group mounts')
  const form = option('Schedule', 'daily').form
  const data = () => Object.fromEntries(new FormData(form))
  const ids = Array.from(document.querySelectorAll('[role="radiogroup"] [id]'), node => node.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(option('Schedule', 'daily').type, 'radio')
  assert.equal(option('Schedule', 'daily').labels[0].textContent.trim(), 'Daily')
  assert.equal(option('Schedule', 'hourly').disabled, true)
  assert.equal(option('Locked', 'daily').disabled, true)
  assert.equal(group('Locked').getAttribute('aria-disabled'), 'true')
  assert.equal(group('Record').getAttribute('aria-required'), 'true')
  assert.equal(option('Record', 'daily').required, true)
  assert.equal(option('Record', 'daily').validity.valueMissing, true)
  assert.deepEqual(data(), { schedule: 'daily', fixed: 'daily' })
  option('Schedule', 'weekly').click()
  await waitFor(() => control('Schedule', 'weekly').dataset.state === 'checked', 'selects weekly')
  assert.equal(option('Schedule', 'daily').checked, false)
  assert.equal(data().schedule, 'weekly')
  option('Record', 'weekly').click()
  await waitFor(() => control('Record', 'weekly').dataset.state === 'checked', 'required group selects weekly')
  assert.equal(option('Record', 'daily').validity.valueMissing, false)
  assert.equal(data().record, 'weekly')
  form.reset()
  await waitFor(() => control('Schedule', 'daily').dataset.state === 'checked'
    && control('Record', 'weekly').dataset.state === 'unchecked', 'reset restores initial states')
  assert.deepEqual(data(), { schedule: 'daily', fixed: 'daily' })
  option('Fixed', 'weekly').click()
  await waitFor(() => document.querySelector('[data-proposed]').textContent === 'weekly', 'controlled request is emitted')
  assert.equal(option('Fixed', 'weekly').checked, false)
  assert.equal(control('Fixed', 'weekly').dataset.state, 'unchecked')
  assert.equal(data().fixed, 'daily')
  option('Managed', 'weekly').click()
  await waitFor(() => control('Managed', 'weekly').dataset.state === 'checked', 'controlled request is accepted')
  assert.equal(data().managed, 'weekly')
  document.querySelector('button').click()
  await waitFor(() => control('Managed', 'weekly').dataset.state === 'unchecked', 'controlled value clears')
  assert.equal(data().managed, undefined)
  await win.happyDOM.close()
} else {
  const plugins = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    solid: async () => (await import('vite-plugin-solid')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
  }
  for (const [name, plugin] of Object.entries(plugins)) test(`Ready RadioGroup ${name}: native radio names, form state, default reset and controlled requests`, { timeout: 120_000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-radio-group-test-'))
    try {
      const { build } = await import('vite')
      const file = join(root, 'test/fixtures/ready-radio-group', `${name}.${name === 'react' || name === 'solid' ? 'tsx' : 'ts'}`)
      await build({ root, configFile: false, logLevel: 'error', plugins: [await plugin()], build: {
        outDir: folder, minify: false, lib: { entry: file, formats: ['es'], fileName: () => 'client.mjs' },
      } })
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  })
}
