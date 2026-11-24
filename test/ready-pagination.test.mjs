// Actual UI primitives rendered by all four compilers in a simulated DOM.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))

if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*|Node.*|Element|Event|CustomEvent|KeyboardEvent|MouseEvent|Document|Text|Comment|DocumentFragment|MutationObserver|ResizeObserver)$/.test(key)) {
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] })
    }
  }
  globalThis.requestAnimationFrame = win.requestAnimationFrame.bind(win)
  globalThis.cancelAnimationFrame = win.cancelAnimationFrame.bind(win)
  const form = document.createElement('form')
  const container = document.createElement('div')
  document.body.append(form)
  form.append(container)
  let submitted = 0
  form.addEventListener('submit', event => { event.preventDefault(); submitted++ })
  const { mount } = await import(pathToFileURL(process.argv[3]))
  const changes = []
  const mounted = mount(container, (scope, page) => changes.push([scope, page]))
  const eventually = async check => {
    const end = Date.now() + 3000
    for (;;) { try { check(); return } catch (error) { if (Date.now() > end) throw error; await new Promise(resolve => setTimeout(resolve, 20)) } }
  }
  const nav = label => container.querySelector(`nav[aria-label="${label}"]`)
  const button = (scope, name) => nav(scope)?.querySelector(`button[aria-label="${name}"]`)
  const page = (scope, n) => nav(scope)?.querySelector(`button[data-index="${n}"]`)
  const current = scope => nav(scope)?.querySelector('[aria-current="page"]')?.textContent?.trim()

  await eventually(() => {
    assert.equal(current('Orders'), '1')
    assert.equal(current('Controlled'), '3')
    assert.equal(current('Uncontrolled'), '4')
    assert.equal(nav('Empty')?.querySelectorAll('button').length, 2)
    assert.equal(button('Orders', 'Previous').disabled, true)
    assert.equal(button('Orders', 'Next').disabled, false)
    assert.equal(button('Empty', 'Previous').disabled, true)
    assert.equal(button('Empty', 'Next').disabled, true)
    assert.equal(nav('Orders').querySelector('[data-part="ellipsis"]').getAttribute('aria-hidden'), 'true')
    assert.ok([...container.querySelectorAll('nav button')].every(button => button.type === 'button'))
    const ids = [...container.querySelectorAll('nav[id], nav [id]')].map(node => node.id)
    assert.equal(new Set(ids).size, ids.length, 'separate landmarks do not reuse generated IDs')
  })
  assert.deepEqual(changes, [], 'initial page resolution is silent')
  button('Orders', 'Previous').click()
  button('Empty', 'Next').click()
  button('Orders', 'Next').click()
  await eventually(() => assert.equal(current('Orders'), '2'))
  page('Orders', 2).click()
  const lastPage = page('Orders', 10)
  lastPage.focus()
  lastPage.click()
  await eventually(() => {
    assert.equal(current('Orders'), '10', '97 items at 10 per page yields 10 pages')
    assert.equal(button('Orders', 'Next').disabled, true)
    assert.equal(document.activeElement, lastPage, 'selecting a rendered page does not remount its focused button')
  })
  button('Orders', 'Next').click()
  button('Controlled', 'Forward').click()
  await eventually(() => assert.deepEqual(changes, [['orders', 2], ['orders', 10], ['controlled', 4]]))
  assert.equal(current('Controlled'), '3', 'controlled parent has not accepted the requested page')
  container.querySelector('[data-act="accept"]').click()
  await eventually(() => assert.equal(current('Controlled'), '4'))
  container.querySelector('[data-act="shrink"]').click()
  await eventually(() => {
    assert.equal(current('Uncontrolled'), '2')
    assert.equal(button('Uncontrolled', 'Next').disabled, true)
  })
  container.querySelector('[data-act="grow"]').click()
  await eventually(() => {
    assert.equal(current('Uncontrolled'), '2', 'uncontrolled clamp is retained after a shrink')
    assert.ok(nav('Uncontrolled')?.querySelector('[data-index="3"]'))
  })
  assert.deepEqual(changes, [['orders', 2], ['orders', 10], ['controlled', 4]], 'prop updates are silent')
  assert.equal(submitted, 0)
  await mounted()
  await win.happyDOM.close()
  console.log('PASS Ready Pagination')
} else for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  test(`Ready Pagination ${framework}: native buttons, bounds, item count, and controlled requests`, { timeout: 120000 }, async () => {
    const dir = await mkdtemp(join(root, 'node_modules/.ready-pagination-'))
    try {
      const { readyConfig } = await import('../scripts/ready.mjs')
      const { build } = await import('vite')
      const path = join(root, `packages/ready/${framework}/Pagination.${{ vue: 'vue', svelte: 'svelte' }[framework] ?? 'tsx'}`)
      const extension = { vue: 'vue', svelte: 'svelte' }[framework] ?? 'tsx'
      const fixture = join(dir, `Fixture.${extension}`)
      const entry = join(dir, 'entry.ts')
      const jsxf = (page, setPage, size, setSize) => `<><Pagination label="Orders" count={97} onPageChange={n => record('orders', n)}/><Pagination label="Controlled" count={61} page={${page}} nextLabel="Forward" onPageChange={n => record('controlled', n)}/><Pagination label="Uncontrolled" count={47} pageSize={${size}} defaultPage={4} onPageChange={n => record('uncontrolled', n)}/><Pagination label="Empty" count={0} onPageChange={n => record('empty', n)}/><button data-act="accept" type="button" onClick={() => ${setPage}}>Accept</button><button data-act="shrink" type="button" onClick={() => ${setSize}(30)}>Shrink</button><button data-act="grow" type="button" onClick={() => ${setSize}(10)}>Grow</button></>`
      let mount
      if (framework === 'react' || framework === 'solid') {
        const react = framework === 'react'
        await writeFile(fixture, `import { Pagination } from '${path}'; import { ${react ? 'useState' : 'createSignal'} } from '${react ? 'react' : 'solid-js'}'; export default function Fixture({record}: {record: (scope: string, page: number) => void}) { const [page, setPage] = ${react ? 'useState' : 'createSignal'}(3), [size, setSize] = ${react ? 'useState' : 'createSignal'}(10); return ${jsxf(react ? 'page' : 'page()', 'setPage(4)', react ? 'size' : 'size()', 'setSize')}; }`)
        mount = react ? `import {createElement} from 'react'; import {createRoot} from 'react-dom/client'; export function mount(target, record){const root=createRoot(target);root.render(createElement(Fixture,{record}));return ()=>root.unmount()}` : `import {render} from 'solid-js/web'; import {createComponent} from 'solid-js'; export function mount(target, record){return render(()=>createComponent(Fixture,{record}),target)}`
      } else if (framework === 'vue') {
        await writeFile(fixture, `<script setup lang="ts">import Pagination from '${path}'; import {ref} from 'vue'; defineProps<{record: (scope: string, page: number) => void}>(); const page=ref(3), size=ref(10);</script><template><Pagination label="Orders" :count="97" @page-change="n => record('orders', n)" /><Pagination label="Controlled" :count="61" :page="page" next-label="Forward" @update:page="n => record('controlled', n)" /><Pagination label="Uncontrolled" :count="47" :page-size="size" :default-page="4" @page-change="n => record('uncontrolled', n)" /><Pagination label="Empty" :count="0" @page-change="n => record('empty', n)" /><button data-act="accept" type="button" @click="page = 4">Accept</button><button data-act="shrink" type="button" @click="size = 30">Shrink</button><button data-act="grow" type="button" @click="size = 10">Grow</button></template>`)
        mount = `import {createApp} from 'vue'; export function mount(target, record){const app=createApp(Fixture,{record});app.mount(target);return ()=>app.unmount()}`
      } else {
        await writeFile(fixture, `<script lang="ts">import Pagination from '${path}'; const {record}: {record:(scope: string, page: number)=>void}=$props(); let page=$state(3), size=$state(10);</script><Pagination label="Orders" count={97} onPageChange={n => record('orders', n)}/><Pagination label="Controlled" count={61} {page} nextLabel="Forward" onPageChange={n => record('controlled', n)}/><Pagination label="Uncontrolled" count={47} pageSize={size} defaultPage={4} onPageChange={n => record('uncontrolled', n)}/><Pagination label="Empty" count={0} onPageChange={n => record('empty', n)}/><button data-act="accept" type="button" onclick={() => {page=4}}>Accept</button><button data-act="shrink" type="button" onclick={() => {size=30}}>Shrink</button><button data-act="grow" type="button" onclick={() => {size=10}}>Grow</button>`)
        mount = `import {mount as start,unmount} from 'svelte'; export function mount(target, record){const app=start(Fixture,{target,props:{record}});return ()=>unmount(app)}`
      }
      await writeFile(entry, `import Fixture from '${fixture}';${mount}`)
      const config = await readyConfig(framework)
      await build({ ...config, root, logLevel: 'error', build: { outDir: join(dir, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
      const output = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(dir, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.match(output, /PASS Ready Pagination/)
    } finally { await rm(dir, { recursive: true, force: true }) }
  })
}
