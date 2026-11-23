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
  async function verify(controlled) {
    const target = document.createElement('div')
    document.body.append(target)
    const expanded = []
    const picked = []
    const cleanup = run(target, {
      label: 'Files',
      ...(controlled ? { expandedValue: [], selectedValue: [] } : {}),
      onExpandedChange: value => expanded.push(value),
      onSelectionChange: value => picked.push(value),
    })
    await settle()
    const tree = target.querySelector('[role=tree]')
    assert.equal(document.getElementById(tree.getAttribute('aria-labelledby')).textContent, 'Files')
    const folder = tree.querySelector('[data-branch=folder]')
    const row = value => tree.querySelector(`[data-value=${value}]:is([data-part=item],[data-part=branch-control])`)
    const isOpen = () => folder.getAttribute('aria-expanded')
    const group = () => folder.querySelector('[role=group]')
    assert.equal(isOpen(), 'false')
    assert.ok(!group() || group().hidden)
    assert.equal(row('folder').tabIndex, 0)
    row('folder').focus()
    await key('ArrowRight')
    assert.deepEqual(expanded, [['folder']])
    if (controlled) {
      assert.equal(isOpen(), 'false', 'parent veto prevents expansion')
      row('readme').focus()
      await key('Enter')
      assert.deepEqual(picked, [['readme']])
      assert.equal(row('readme').getAttribute('aria-selected'), 'false', 'parent veto prevents selection')
    } else {
      assert.equal(isOpen(), 'true')
      assert.equal(group().hidden, false)
      await key('ArrowRight')
      assert.equal(document.activeElement, row('first'))
      assert.equal(row('first').getAttribute('aria-level'), '2')
      await key('ArrowDown')
      assert.equal(document.activeElement, row('nested'), 'focus movement skips disabled items')
      await key('ArrowUp')
      assert.equal(document.activeElement, row('first'))
      await key(' ')
      assert.deepEqual(picked, [['first']])
      assert.equal(row('first').getAttribute('aria-selected'), 'true')
      row('disabled').click()
      await settle()
      assert.deepEqual(picked, [['first']], 'disabled item cannot be selected')
      await key('ArrowLeft')
      assert.equal(document.activeElement, row('folder'))
      await key('ArrowLeft')
      assert.deepEqual(expanded, [['folder'], []])
      assert.equal(isOpen(), 'false')
      assert.ok(!group() || group().hidden)
      folder.querySelector('[data-part=branch-trigger]').click()
      await settle()
      assert.equal(isOpen(), 'true')
      assert.deepEqual(picked, [['first']], 'pointer disclosure does not select')
    }
    await cleanup()
    target.remove()
  }
  await verify(false)
  await verify(true)
  await win.happyDOM.close()
  console.log('PASS Ready Tree')
} else test('Ready Tree validates globally unique node IDs, bounded depth and state values', async () => {
  const { treeModel, treeState, treeLabel } = await import('../packages/ready/Tree.ts')
  const leaf = { value: 'a', label: 'A' }
  const known = treeModel([{ value: 'root', label: 'Root', children: [leaf] }])
  assert.deepEqual(treeState(['root'], known.branches, 'expanded'), ['root'])
  assert.deepEqual(treeState(['a'], known.selectable, 'selected'), ['a'])
  assert.throws(() => treeModel([leaf, {value:'b', label:'B', children:[leaf]}]), /globally unique/)
  assert.throws(() => treeLabel(' '), /label/)
  let deep = leaf
  for (let index = 0; index < 8; index++) deep = { value: `deep${index}`, label: 'Deep', children: [deep] }
  assert.throws(() => treeModel([deep]), /eight levels/)
  assert.throws(() => treeModel(Array.from({length: 251}, (_, index) => ({value: String(index), label: 'Node'}))), /250 nodes/)
  assert.throws(() => treeState(['a'], known.branches, 'expanded'), /branches/)
  assert.throws(() => treeState(['a','root'], known.selectable, 'selected'), /at most one/)
  assert.throws(() => treeState(['disabled'], treeModel([{value:'disabled',label:'Disabled',disabled:true}]).selectable, 'selected'), /enabled/)
})

if (process.argv[2] !== '--worker') for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} Tree: bounded depth, keyboard, expansion and controlled selection`, { timeout: 120000 }, async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-tree-'))
  try {
    const items = `[{value:'folder',label:'Folder',children:[{value:'first',label:'First'},{value:'disabled',label:'Disabled',disabled:true},{value:'nested',label:'Nested',children:[{value:'deep',label:'Deep'}]}]},{value:'readme',label:'Readme'}]`
    const source = `${root}packages/ready/${framework}/Tree.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
    let plugin, code
    if (framework === 'react') {
      plugin = (await import('@vitejs/plugin-react')).default()
      code = `import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {Tree} from '${source}';export function run(target, props){const root=createRoot(target);root.render(h(Tree,{...props,items:${items}}));return()=>root.unmount()}`
    } else if (framework === 'solid') {
      plugin = (await import('vite-plugin-solid')).default()
      code = `import {render} from 'solid-js/web';import {Tree} from '${source}';export function run(target,props){return render(()=><Tree {...props} items={${items}}/>,target)}`
    } else if (framework === 'vue') {
      plugin = (await import('@vitejs/plugin-vue')).default()
      code = `import {createApp,h} from 'vue';import Tree from '${source}';export function run(target,props){const app=createApp({render:()=>h(Tree,{...props,items:${items}})});app.mount(target);return()=>app.unmount()}`
    } else {
      plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
      await writeFile(join(folder, 'Fixture.svelte'), `<script>import Tree from '${source}';let props=$props()</script><Tree {...props} items={${items}}/>`)
      code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,props){const app=mount(Fixture,{target,props});return()=>unmount(app)}`
    }
    const entry = join(folder, 'entry.tsx')
    await writeFile(entry, code)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready Tree/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
