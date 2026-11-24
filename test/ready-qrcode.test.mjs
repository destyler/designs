import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { encode } from 'uqr'

const root = fileURLToPath(new URL('../', import.meta.url))
const initial = '  设计 🐉  '
const changed = '  Tokyo・東京  '
const max = '🐉'.repeat(64) // exactly 256 UTF-8 bytes
const waitFor = async (condition, message) => {
  for (let i = 0; i < 40; i++) {
    if (condition()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.ok(condition(), message)
}

if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (/^(window|document|navigator|HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] })
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  let requests = 0
  win.fetch = globalThis.fetch = async () => { requests++; throw new Error('Unexpected QR network request') }
  document.body.innerHTML = '<div id="app"></div>'
  await import(pathToFileURL(process.argv[3]))
  const graphic = name => document.querySelector(`svg[role=img][aria-label="${name}"]`)
  const pattern = name => graphic(name)?.querySelector('path[data-part=pattern]')
  const expected = value => {
    const { size, data } = encode(value, { border: 4, ecc: 'M' })
    const view = size * 10
    const path = data.flatMap((row, y) =>
      row.map((dark, x) => dark ? `M${x * 10},${y * 10}h10v10h-10z` : '')).join('')
    return { view, path }
  }
  const assertGraphic = (label, value, size) => {
    const frame = graphic(label)
    const path = pattern(label)
    const expectedGraphic = expected(value)
    assert.equal(frame.namespaceURI, 'http://www.w3.org/2000/svg')
    assert.equal(path.namespaceURI, 'http://www.w3.org/2000/svg')
    assert.equal(frame.getAttribute('width'), String(size))
    assert.equal(frame.getAttribute('height'), String(size))
    assert.equal(frame.getAttribute('viewBox'), `0 0 ${expectedGraphic.view} ${expectedGraphic.view}`)
    assert.equal(frame.getAttribute('shape-rendering'), 'crispEdges')
    assert.match(frame.getAttribute('style'), /background-color:\s*(?:#fff|rgb\(255, 255, 255\))/)
    assert.equal(path.getAttribute('fill'), '#111827')
    assert.equal(path.getAttribute('d'), expectedGraphic.path, 'the exact, untrimmed payload reaches the primitive')
    const modules = [...path.getAttribute('d').matchAll(/M(\d+),(\d+)h10v10h-10z/g)]
    assert.ok(modules.length)
    for (const [,x,y] of modules) {
      assert.ok(+x >= 40 && +y >= 40 && +x + 10 <= expectedGraphic.view - 40 && +y + 10 <= expectedGraphic.view - 40)
    }
  }
  await waitFor(() => graphic('Design QR'), 'accessible SVG mounts')
  assertGraphic('Design QR', initial, 256)
  assertGraphic('Limit QR', max, 144)
  const original = pattern('Design QR').getAttribute('d')
  assert.notEqual(graphic('Design QR').id, graphic('Limit QR').id)
  const prepare = window.qrValidation
  assert.equal(prepare({value:initial,label:'A'}).value, initial)
  assert.throws(() => prepare({value:'\ud800',label:'A'}), /Unicode/)
  assert.throws(() => prepare({value:' \t ',label:'A'}), /Unicode/)
  assert.throws(() => prepare({value:max+'1',label:'A'}), /256 UTF-8/)
  assert.throws(() => prepare({value:'a',label:''}), /label/)
  assert.throws(() => prepare({value:'a',label:'A',size:95}), /size/)
  assert.throws(() => prepare({value:'a',label:'A',size:512.1}), /size/)
  document.querySelector('button').click()
  await waitFor(() => pattern('Design QR').getAttribute('d') !== original, 'changing the input regenerates the primitive path')
  assertGraphic('Design QR', changed, 256)
  assertGraphic('Limit QR', max, 144)
  assert.equal(document.querySelector('[data-part=download-trigger],[data-part=overlay],svg image,svg a'), null)
  assert.equal(requests, 0)
  await win.happyDOM.close()
} else {
  const state = `import { prepareQRCode } from '../../packages/ready/QRCode'; window.qrValidation = prepareQRCode;
    export const initial = ${JSON.stringify(initial)};
    export const changed = ${JSON.stringify(changed)};
    export const max = ${JSON.stringify(max)};`
  const fixtures = {
    react: {
      ext: 'tsx',
      plugins: async () => [(await import('@vitejs/plugin-react')).default()],
      entry: `import { useState } from 'react'; import { createRoot } from 'react-dom/client';
        import { QRCode } from '../../packages/ready/react/QRCode'; import { initial, changed, max } from './state';
        function App() { const [value,setValue] = useState(initial); return <><QRCode value={value} label="Design QR"/>
          <QRCode value={max} label="Limit QR" size={144}/><button onClick={() => setValue(changed)}>Change</button></> }
        createRoot(document.querySelector('#app')!).render(<App/>);`,
    },
    vue: {
      ext: 'ts',
      plugins: async () => [(await import('@vitejs/plugin-vue')).default()],
      entry: `import { createApp } from 'vue'; import App from './App.vue'; createApp(App).mount('#app');`,
      app: `<script setup lang="ts">import { ref } from 'vue'; import QRCode from '../../packages/ready/vue/QRCode.vue';
        import { initial, changed, max } from './state'; const value=ref(initial);</script>
        <template><QRCode :value="value" label="Design QR"/><QRCode :value="max" label="Limit QR" :size="144"/>
          <button @click="value=changed">Change</button></template>`,
    },
    solid: {
      ext: 'tsx',
      plugins: async () => [(await import('vite-plugin-solid')).default()],
      entry: `import { createSignal } from 'solid-js'; import { render } from 'solid-js/web';
        import { QRCode } from '../../packages/ready/solid/QRCode'; import { initial, changed, max } from './state';
        const [value,setValue] = createSignal(initial); render(() => <><QRCode value={value()} label="Design QR"/>
        <QRCode value={max} label="Limit QR" size={144}/><button onClick={() => setValue(changed)}>Change</button></>,document.querySelector('#app')!);`,
    },
    svelte: {
      ext: 'ts',
      plugins: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
      entry: `import { mount } from 'svelte'; import App from './App.svelte'; mount(App,{target:document.querySelector('#app')!});`,
      app: `<script lang="ts">import QRCode from '../../packages/ready/svelte/QRCode.svelte';
        import { initial, changed, max } from './state'; let value=$state(initial);</script>
        <QRCode {value} label="Design QR"/><QRCode value={max} label="Limit QR" size={144}/>
        <button onclick={() => value=changed}>Change</button>`,
    },
  }
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready QRCode ${framework}: labels, real matrix quiet zone, bounded Unicode and reactive updates`, { timeout: 120_000 }, async () => {
      const folder = await mkdtemp(join(root, 'node_modules/.ready-qrcode-test-'))
      try {
        const { build } = await import('vite')
        await writeFile(join(folder, 'state.ts'), state)
        const entry = join(folder, `entry.${fixture.ext}`)
        await writeFile(entry, fixture.entry)
        if (fixture.app) await writeFile(join(folder, framework === 'vue' ? 'App.vue' : 'App.svelte'), fixture.app)
        await build({ root, configFile: false, logLevel: 'error', plugins: await fixture.plugins(), build: {
          outDir: join(folder, 'dist'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' },
        } })
        execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'dist/client.mjs')], {
          cwd: root, encoding: 'utf8', timeout: 30_000,
        })
      } finally {
        await rm(folder, { recursive: true, force: true })
      }
    })
  }
}
