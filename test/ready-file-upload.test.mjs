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
    if (/^(window|document|navigator|HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|FormData|DataTransfer|File|Blob)$/.test(key)) {
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] })
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  document.body.innerHTML = '<div id="app"></div>'
  await import(pathToFileURL(process.argv[3]))
  const root = name => Array.from(document.querySelectorAll('.rd-file-upload'))
    .find(node => node.querySelector('label')?.textContent.trim() === name)
  const input = () => root('Attachments')?.querySelector('input[type=file]')
  const list = () => [...root('Attachments').querySelectorAll('li')].map(node =>
    node.querySelector('[data-part=item-name]').textContent.trim())
  const status = () => root('Attachments').querySelector('[role=status]').textContent.trim()
  const dropin = (files, target = input()) => {
    const transfer = new win.DataTransfer()
    files.forEach(file => transfer.items.add(file))
    target.files = transfer.files
    target.dispatchEvent(new win.Event('input', { bubbles: true }))
  }
  const file = (name, data, type = 'text/plain') => new win.File([data], name, { type })
  await waitFor(input, 'named file picker renders')
  const choose = root('Attachments').querySelector('button')
  assert.equal(choose.type, 'button')
  assert.equal(root('Attachments').getAttribute('role'), 'group')
  assert.equal(root('Attachments').getAttribute('aria-label'), 'Attachments')
  assert.equal(choose.getAttribute('aria-label'), 'Choose files: Attachments')
  assert.equal(input().labels[0].textContent.trim(), 'Attachments')
  assert.equal(input().getAttribute('accept'), '.txt')
  assert.equal(input().multiple, true)
  assert.equal(input().hasAttribute('name'), false, 'standalone picker must not imply native form participation')
  assert.equal(input().required, false)
  assert.equal(root('Locked').querySelector('button').disabled, true)
  assert.equal(root('Locked').querySelector('input').disabled, true)
  assert.equal(status(), 'No files selected.')
  dropin([file('notes.txt', 'yes'), file('large.txt', '123456789'), file('image.png', 'no', 'image/png')])
  await waitFor(() => list().length === 1 && /file is too large/.test(status()), 'type/size rejections and accepted file render')
  assert.deepEqual(list(), ['notes.txt'])
  assert.match(status(), /image\.png: unsupported file type/)
  assert.deepEqual(JSON.parse(document.querySelector('[data-files]').textContent), [{ name: 'notes.txt', size: 3 }])
  assert.deepEqual([...new FormData(input().form)], [])
  let pickerClicks = 0
  input().addEventListener('click', () => pickerClicks++)
  choose.click()
  await waitFor(() => pickerClicks === 1, 'the visible trigger opens the primitive input')
  // Canceling a picker must not clear the accepted callback state or the visible list.
  assert.deepEqual(list(), ['notes.txt'])
  assert.deepEqual(JSON.parse(document.querySelector('[data-files]').textContent), [{ name: 'notes.txt', size: 3 }])
  dropin([file('extra.txt', '1'), file('third.txt', '2')])
  await waitFor(() => /too many files/.test(status()), 'selection limit is enforced')
  assert.deepEqual(list(), ['notes.txt'])
  dropin([file('notes.txt', 'different')])
  await waitFor(() => /file is too large/.test(status()), 'oversize same name is independently rejected')
  dropin([file('notes.txt', 'another')])
  await waitFor(() => list().length === 2, 'multiple same-name files receive distinct item IDs')
  const ids = [...root('Attachments').querySelectorAll('li[id], [data-part=item-name][id]')].map(node => node.id)
  assert.equal(ids.length, 4)
  assert.equal(new Set(ids).size, 4)
  const removeButton = root('Attachments').querySelectorAll('button[aria-label="Remove notes.txt"]')[0]
  removeButton.focus()
  assert.equal(document.activeElement, removeButton)
  removeButton.click()
  await waitFor(() => list().length === 1, 'remove one of two same-name files')
  assert.equal(document.activeElement, choose)
  assert.deepEqual(JSON.parse(document.querySelector('[data-files]').textContent), [{ name: 'notes.txt', size: 7 }])
  root('Attachments').querySelector('button[aria-label="Remove notes.txt"]').click()
  await waitFor(() => status() === 'No files selected.', 'remove last file and announce empty selection')
  assert.deepEqual(JSON.parse(document.querySelector('[data-files]').textContent), [])
  dropin([file('locked.txt', 'yes')], root('Locked').querySelector('input'))
  assert.equal(root('Locked').querySelector('li'), null)
  await win.happyDOM.close()
} else {
  const plugins = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    solid: async () => (await import('vite-plugin-solid')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
  }
  for (const [name, plugin] of Object.entries(plugins)) test(`Ready FileUpload ${name}: picker naming, file validation, removal and standalone callback`, { timeout: 120_000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-file-upload-test-'))
    try {
      const { build } = await import('vite')
      const file = join(root, 'test/fixtures/ready-file-upload', `${name}.${name === 'react' || name === 'solid' ? 'tsx' : 'ts'}`)
      await build({ root, configFile: false, logLevel: 'error', plugins: [await plugin()], build: {
        outDir: folder, minify: false, lib: { entry: file, formats: ['es'], fileName: () => 'client.mjs' },
      } })
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  })
}
