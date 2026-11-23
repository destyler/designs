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
  async function verify(props) {
    const target = document.createElement('div')
    document.body.append(target)
    const changes = []
    const cleanup = run(target, { headingLevel: 4, onValueChange: value => changes.push(value), ...props })
    await settle()
    const [first, disabled, last] = target.querySelectorAll('button')
    const panel = tab => document.getElementById(tab.getAttribute('aria-controls'))
    const expanded = () => [first, disabled, last].map(tab => tab.getAttribute('aria-expanded'))
    assert.equal(first.type, 'button')
    assert.equal(first.parentElement.getAttribute('role'), 'heading')
    assert.equal(first.parentElement.getAttribute('aria-level'), '4')
    assert.equal(first.querySelector('[data-part=item-indicator]').getAttribute('aria-hidden'), 'true')
    assert.equal(disabled.disabled, true)
    assert.deepEqual(expanded(), ['true', 'false', 'false'])
    assert.equal(panel(first).getAttribute('aria-labelledby'), first.id)
    assert.equal(panel(first).getAttribute('role'), 'region')
    assert.equal(panel(first).querySelector('strong').textContent, 'First!')
    assert.equal(panel(last).hidden, true)
    disabled.click()
    await settle()
    assert.deepEqual(changes, [])
    first.focus()
    await key(props.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown')
    assert.equal(document.activeElement, last, 'keyboard skips disabled item')
    await key('Home')
    assert.equal(document.activeElement, first)
    await key('End')
    assert.equal(document.activeElement, last)
    assert.deepEqual(changes, [], 'moving between headings does not open sections')
    last.click()
    await settle()
    if (props.value) {
      assert.deepEqual(changes, [['first', 'last']])
      assert.deepEqual(expanded(), ['true', 'false', 'false'], 'parent veto leaves opened items unchanged')
    } else if (props.multiple) {
      assert.deepEqual(changes, [['first', 'last']])
      assert.deepEqual(expanded(), ['true', 'false', 'true'])
      last.click()
      await settle()
      assert.deepEqual(changes, [['first', 'last'], ['first']])
      assert.deepEqual(expanded(), ['true', 'false', 'false'])
    } else {
      assert.deepEqual(changes, [['last']])
      assert.deepEqual(expanded(), ['false', 'false', 'true'])
      assert.equal(panel(first).hidden, true)
      assert.equal(panel(last).hidden, false)
      last.click()
      await settle()
      assert.deepEqual(changes, [['last'], []])
      assert.deepEqual(expanded(), ['false', 'false', 'false'])
    }
    await cleanup()
    target.remove()
  }
  await verify({ defaultValue: ['first'], collapsible: true })
  await verify({ value: ['first'], multiple: true, orientation: 'horizontal' })
  await verify({ defaultValue: ['first'], multiple: true })
  const blocked = document.createElement('div')
  document.body.append(blocked)
  const finish = run(blocked, { disabled: true, onValueChange: () => assert.fail('disabled accordion changed') })
  await settle()
  assert.equal(blocked.querySelectorAll('button:disabled').length, 3)
  for (const trigger of blocked.querySelectorAll('button')) trigger.click()
  await settle()
  await finish()
  blocked.remove()
  await win.happyDOM.close()
  console.log('PASS Ready Collapse')
} else test('Ready Collapse validates labels, IDs and expansion arrays', async () => {
  const { collapseItems, collapseValue } = await import('../packages/ready/Collapse.ts')
  const first = { value: 'first', label: 'First' }
  const last = { value: 'last', label: 'Last' }
  const known = collapseItems([first, last])
  assert.throws(() => collapseItems([first, first]), /unique/)
  assert.throws(() => collapseItems([{ ...first, value: 'x y' }]), /whitespace/)
  assert.throws(() => collapseItems([{ ...first, label: ' ' }]), /item labels/)
  assert.throws(() => collapseValue(known, false, ['first', 'last']), /single-open/)
  assert.throws(() => collapseValue(known, true, ['first', 'first']), /distinct/)
  assert.throws(() => collapseValue(known, true, ['missing']), /distinct/)
  assert.deepEqual(collapseValue(known, true, ['first', 'last']), ['first', 'last'])
})

if (process.argv[2] !== '--worker') for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} Collapse: rendered panels, single-open, multi-open controlled proposals and keyboard`, { timeout: 120000 }, async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-collapse-'))
  try {
    const items = `[{value:'first',label:'First'},{value:'off',label:'Off',disabled:true},{value:'last',label:'Last'}]`
    const source = `${root}packages/ready/${framework}/Collapse.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
    let plugin, code
    if (framework === 'react') {
      plugin = (await import('@vitejs/plugin-react')).default()
      code = `import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {Collapse} from '${source}';export function run(target, props){const root=createRoot(target);root.render(h(Collapse,{...props,items:${items}, renderPanel:item=>h('strong',null,item.label+'!')}));return()=>root.unmount()}`
    } else if (framework === 'solid') {
      plugin = (await import('vite-plugin-solid')).default()
      code = `import {render} from 'solid-js/web';import {Collapse} from '${source}';export function run(target,props){return render(()=><Collapse {...props} items={${items}} renderPanel={item=><strong>{item.label}!</strong>}/>,target)}`
    } else if (framework === 'vue') {
      plugin = (await import('@vitejs/plugin-vue')).default()
      code = `import {createApp,h} from 'vue';import Collapse from '${source}';export function run(target,props){const app=createApp({render:()=>h(Collapse,{...props,items:${items}},{panel:({item})=>h('strong',item.label+'!')})});app.mount(target);return()=>app.unmount()}`
    } else {
      plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
      await writeFile(join(folder, 'Fixture.svelte'), `<script>import Collapse from '${source}';let props=$props()</script><Collapse {...props} items={${items}}>{#snippet panel(item)}<strong>{item.label}!</strong>{/snippet}</Collapse>`)
      code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,props){const app=mount(Fixture,{target,props});return()=>unmount(app)}`
    }
    const entry = join(folder, 'entry.tsx')
    await writeFile(entry, code)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready Collapse/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
