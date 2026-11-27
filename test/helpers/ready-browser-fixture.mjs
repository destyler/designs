import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const plugins = {
  react: async () => (await import('@vitejs/plugin-react')).default(),
  vue: async () => (await import('@vitejs/plugin-vue')).default(),
  solid: async () => (await import('vite-plugin-solid')).default(),
  svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
}
const mount = {
  vue: "import {createApp} from 'vue';import Fixture from './Fixture.vue';createApp(Fixture).mount('#app')",
  svelte: "import {mount} from 'svelte';import Fixture from './Fixture.svelte';mount(Fixture,{target:document.getElementById('app')})",
}

export async function runReadyFixture(root, framework, fixture, worker, { define, timeout = 30_000 } = {}) {
  const dir = await mkdtemp(join(root, 'node_modules/.ready-fixture-'))
  try {
    const inline = !mount[framework]
    const entry = join(dir, inline ? 'entry.tsx' : 'entry.js')
    if (!inline) await writeFile(join(dir, `Fixture.${framework}`), fixture)
    await writeFile(entry, inline ? fixture : mount[framework])
    const { build } = await import('vite')
    await build({ root, configFile: false, define, logLevel: 'error', plugins: [await plugins[framework]()], build: {
      outDir: join(dir, 'out'), lib: { entry, formats: ['es'], fileName: () => 'fixture.mjs' },
    } })
    execFileSync(process.execPath, [worker, '--ready-fixture', join(dir, 'out/fixture.mjs')], { cwd: root, timeout, stdio: 'inherit' })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function openReadyDom(bundle) {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (/^(window|document|navigator|HTML.*Element|SVG.*Element|Element|Node.*|Document|DocumentFragment|DocumentType|Text|Comment|Event|CustomEvent|.*Event|MutationObserver|ResizeObserver|IntersectionObserver|FormData)$/.test(key))
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] })
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  document.body.innerHTML = '<div id="app"></div>'
  await import(pathToFileURL(bundle).href)
  return () => win.happyDOM.close()
}

export async function readyEventually(read, message) {
  for (let i = 0; i < 40; i++) {
    if (read()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.ok(read(), message)
}
