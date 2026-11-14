import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))
if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom'); const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) { try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {} }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const { run } = await import(pathToFileURL(process.argv[3]))
  const settle = () => new Promise(resolve => setTimeout(resolve, 100))
  const target = document.createElement('section'); document.body.append(target)
  const app = run(target); await settle()
  const ids = [...target.querySelectorAll('[id]')].map(node => node.id)
  assert.equal(new Set(ids).size, ids.length, 'Multiple dialogs in one application have unique IDs')
  const part = (family, name) => target.querySelector(`[data-scope="${family}"][data-part="${name}"]`)
  const references = () => { for (const node of target.querySelectorAll('[aria-labelledby],[aria-describedby]')) for (const attr of ['aria-labelledby', 'aria-describedby']) for (const id of (node.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) assert.ok(document.getElementById(id), `${attr} points to missing ${id}`) }
  assert.equal(target.querySelector('input').disabled, true)
  assert.equal(part('select', 'trigger').disabled, true)
  assert.equal(target.querySelector('select').disabled, true)
  part('checkbox', 'control').click(); part('select', 'trigger').click(); await settle()
  assert.equal(target.querySelector('input').checked, false)
  assert.equal(part('select', 'trigger').getAttribute('aria-expanded'), 'false')
  part('dialog', 'trigger').click(); await settle(); references()
  assert.equal(part('dialog', 'content').getAttribute('role'), 'dialog')
  assert.equal(part('dialog', 'content').getAttribute('aria-modal'), 'true')
  assert.equal(document.getElementById(part('dialog', 'content').getAttribute('aria-labelledby')).textContent, 'Accessible title')
  assert.equal(part('dialog', 'content').hasAttribute('aria-describedby'), false, 'Optional absent description has no dangling reference')
  app.describe('Added description'); await settle(); references()
  const descriptions = [...target.querySelectorAll('[data-scope=dialog][data-part=description]')]
  assert.equal(descriptions.length, 2)
  assert.notEqual(descriptions[0].id, descriptions[1].id, 'Each dialog owns its description ID')
  assert.equal(document.getElementById(part('dialog', 'content').getAttribute('aria-describedby'))?.textContent, 'Added description', 'Description added while open is associated')
  app.describe(''); await settle(); references()
  assert.equal(part('dialog', 'content').hasAttribute('aria-describedby'), false, 'Removed description has no dangling reference')
  part('dialog','close-trigger').click(); await settle()
  app.describe('Initial description'); await settle()
  part('dialog','trigger').click(); await settle(); references()
  assert.equal(document.getElementById(part('dialog','content').getAttribute('aria-describedby'))?.textContent,'Initial description')
  app.describe(''); await settle(); references()
  assert.equal(part('dialog','content').hasAttribute('aria-describedby'),false,'Initially present description can be removed while open')
  await app.cleanup(); const events=[]; const frozen=run(target,true,events); await settle()
  part('dialog','trigger').click(); await settle()
  assert.deepEqual(events,[true], 'Frozen controlled dialog reports request')
  assert.equal(part('dialog','trigger').getAttribute('aria-expanded'),'false','Parent open=false remains authoritative')
  assert.ok(part('dialog','content').hidden, 'Rejected request leaves dialog hidden')
  await frozen.cleanup(); await win.happyDOM.close(); console.log('PASS accessibility contracts')
} else for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework}: disabled semantics, dynamic descriptions and frozen dialog`, { timeout: 120000 }, async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-a11y-'))
  try {
    let code, plugin
    const source = `${root}packages/ready/${framework}`
    if (framework === 'react') {
      plugin = (await import('@vitejs/plugin-react')).default()
      code = `import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Checkbox,Select,Dialog} from '${source}';export function run(target,frozen=false,events=[]){let describe;function App(){const [description,set]=useState('');describe=set;return h('div',null,h(Checkbox,{label:'Disabled checkbox',disabled:true}),h(Select,{label:'Disabled select',disabled:true,options:[]}),h(Dialog,{trigger:'Open',title:'Accessible title',description,open:frozen?false:undefined,onOpenChange:value=>events.push(value)}),h(Dialog,{trigger:'Second',title:'Second dialog',description:'Separate description'}));}const root=createRoot(target);root.render(h(App));return {describe:value=>describe(value),cleanup:()=>root.unmount()}}`
    } else if (framework === 'solid') {
      plugin = (await import('vite-plugin-solid')).default()
      code = `import {render} from 'solid-js/web';import {createComponent as h,createSignal} from 'solid-js';import {Checkbox,Select,Dialog} from '${source}';export function run(target,frozen=false,events=[]){const [description,describe]=createSignal('');const cleanup=render(()=>[h(Checkbox,{label:'Disabled checkbox',disabled:true}),h(Select,{label:'Disabled select',disabled:true,options:[]}),h(Dialog,{trigger:'Open',title:'Accessible title',open:frozen?false:undefined,onOpenChange:value=>events.push(value),get description(){return description()}}),h(Dialog,{trigger:'Second',title:'Second dialog',description:'Separate description'})],target);return {describe,cleanup}}`
    } else if (framework === 'vue') {
      plugin = (await import('@vitejs/plugin-vue')).default()
      code = `import {createApp,h,ref} from 'vue';import {Checkbox,Select,Dialog} from '${source}';export function run(target,frozen=false,events=[]){const description=ref('');const app=createApp({render:()=>h('div',[h(Checkbox,{label:'Disabled checkbox',disabled:true}),h(Select,{label:'Disabled select',disabled:true,options:[]}),h(Dialog,{trigger:'Open',title:'Accessible title',description:description.value,open:frozen?false:undefined,onOpenChange:value=>events.push(value)}),h(Dialog,{trigger:'Second',title:'Second dialog',description:'Separate description'})])});app.mount(target);return {describe:value=>description.value=value,cleanup:()=>app.unmount()}}`
    } else {
      plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
      await writeFile(join(folder, 'Fixture.svelte'), `<script>import {Checkbox,Select,Dialog} from '${source}';let {frozen,events}=$props();let description=$state('');export function describe(value){description=value}</script><Checkbox label="Disabled checkbox" disabled/><Select label="Disabled select" disabled options={[]}/><Dialog trigger="Open" title="Accessible title" {description} open={frozen?false:undefined} onOpenChange={value=>events.push(value)}/><Dialog trigger="Second" title="Second dialog" description="Separate description"/>`)
      code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,frozen=false,events=[]){const app=mount(Fixture,{target,props:{frozen,events}});return {describe:app.describe,cleanup:()=>unmount(app)}}`
    }
    const entry = join(folder, 'entry.mjs'); await writeFile(entry, code)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS accessibility/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
