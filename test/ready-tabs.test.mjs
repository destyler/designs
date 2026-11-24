import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const { run } = await import(pathToFileURL(process.argv[3]))
  const settle = () => new Promise(resolve => setTimeout(resolve, 65))
  const eventually = async (predicate, message) => {
    const deadline = Date.now() + 3000
    while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 16))
    assert.ok(predicate(), message)
  }
  const key = async name => {
    document.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
    await settle()
  }
  async function verify(mode, orientation, controlled) {
    const target = document.createElement('div')
    document.body.append(target)
    const changes = []
    const cleanup = run(target, { label: 'Settings', activationMode: mode, orientation, value: controlled ? 'first' : undefined, onValueChange: value => changes.push(value) })
    await eventually(() => target.querySelector('[role=tablist]'), 'tab list mounts')
    const list = target.querySelector('[role=tablist]')
    const [disabled, first, last] = list.querySelectorAll('[role=tab]')
    assert.equal(list.getAttribute('aria-label'), 'Settings')
    assert.equal(list.getAttribute('aria-orientation'), orientation)
    assert.equal(disabled.disabled, true)
    const panel = tab => [...target.querySelectorAll('[role=tabpanel]')].find(element => element.getAttribute('aria-labelledby') === tab.id)
    assert.equal(first.getAttribute('aria-selected'), 'true')
    assert.equal(first.getAttribute('tabindex'), '0')
    assert.equal(panel(first).hidden, false)
    assert.equal(panel(first).id, first.getAttribute('aria-controls'))
    assert.equal(panel(first).querySelector('strong').textContent, 'First!')
    assert.equal(panel(last).hidden, true)
    disabled.click()
    await settle()
    assert.deepEqual(changes, [])
    first.focus()
    await key(orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp')
    await eventually(() => document.activeElement === last, 'keyboard wraps and skips disabled tab')
    if (mode === 'manual') {
      assert.equal(first.getAttribute('aria-selected'), 'true')
      assert.deepEqual(changes, [])
      last.click()
      await settle()
    }
    await eventually(() => changes.length === 1 && panel(first).hidden === !controlled && panel(last).hidden === controlled, 'callback and committed panels agree')
    assert.deepEqual(changes, ['last'])
    assert.equal(panel(first).hidden, !controlled)
    assert.equal(panel(last).hidden, controlled)
    assert.equal(last.getAttribute('aria-selected'), String(!controlled))
    await cleanup()
    target.remove()
  }
  await verify('automatic', 'horizontal', false)
  await verify('manual', 'vertical', true)
  await win.happyDOM.close()
  console.log('PASS Ready Tabs')
} else test('Ready Tabs validates names, ID-safe values and the initial selection', async () => {
  const { validateTabs } = await import('../packages/ready/Tabs.model.ts')
  const off = { value: 'off', label: 'Off', disabled: true }
  const on = { value: 'on', label: 'On' }
  const alternate = { value: 'next', label: 'Next' }
  assert.equal(validateTabs('Settings', [off, on, alternate]), 'on')
  assert.equal(validateTabs('Settings', [off, on, alternate], undefined, 'next'), 'next')
  assert.equal(validateTabs('Settings', [off]), undefined)
  assert.throws(() => validateTabs(' ', [on]), /label/)
  assert.throws(() => validateTabs('Settings', [{ ...on, label: ' ' }]), /item labels/)
  assert.throws(() => validateTabs('Settings', [{ ...on, value: 'a b' }]), /whitespace/)
  assert.throws(() => validateTabs('Settings', [on, on]), /unique/)
  assert.throws(() => validateTabs('Settings', [off, on], 'off'), /enabled item/)
  assert.throws(() => validateTabs('Settings', [on], undefined, 'missing'), /enabled item/)
})

if (process.argv[2] !== '--worker') for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} Tabs: rendered panels, disabled skipping and controlled/manual activation`, { timeout: 120000 }, async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-tabs-'))
  try {
    const items = `[{value:'off',label:'Off',disabled:true},{value:'first',label:'First'},{value:'last',label:'Last'}]`
    const source = `${root}packages/ready/${framework}/Tabs.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
    let plugin, code
    if (framework === 'react') {
      plugin = (await import('@vitejs/plugin-react')).default()
      code = `import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {Tabs} from '${source}';export function run(target, props){const root=createRoot(target);root.render(h(Tabs,{...props,items:${items}, renderPanel:item=>h('strong',null,item.label+'!')}));return()=>root.unmount()}`
    } else if (framework === 'solid') {
      plugin = (await import('vite-plugin-solid')).default()
      code = `import {render} from 'solid-js/web';import {Tabs} from '${source}';export function run(target,props){return render(()=><Tabs {...props} items={${items}} renderPanel={item=><strong>{item.label}!</strong>}/>,target)}`
    } else if (framework === 'vue') {
      plugin = (await import('@vitejs/plugin-vue')).default()
      code = `import {createApp,h} from 'vue';import Tabs from '${source}';export function run(target,props){const app=createApp({render:()=>h(Tabs,{...props,items:${items}},{panel:({item})=>h('strong',item.label+'!')})});app.mount(target);return()=>app.unmount()}`
    } else {
      plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
      await writeFile(join(folder, 'Fixture.svelte'), `<script>import Tabs from '${source}';let props=$props()</script><Tabs {...props} items={${items}}>{#snippet panel(item)}<strong>{item.label}!</strong>{/snippet}</Tabs>`)
      code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,props){const app=mount(Fixture,{target,props});return()=>unmount(app)}`
    }
    const entry = join(folder, 'entry.tsx')
    await writeFile(entry, code)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready Tabs/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
