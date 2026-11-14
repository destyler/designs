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
  const settle = () => new Promise(resolve => setTimeout(resolve, 120))
  const background=document.createElement('button');background.textContent='Background action';document.body.append(background)
  const baseline={pointerEvents:document.body.style.pointerEvents,overflow:document.body.style.overflow,ariaHidden:background.getAttribute('aria-hidden')}
  const target=document.createElement('section');document.body.append(target)
  const cleanup=run(target);await settle()
  const part=(scope,name)=>target.querySelector(`[data-scope="${scope}"][data-part="${name}"]`)
  const key=async(key,extra={})=>{document.activeElement.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extra}));await settle()}
  const trigger=part('dialog','trigger');trigger.focus();trigger.click();await settle()
  assert.equal(trigger.getAttribute('aria-expanded'),'true')
  assert.ok(part('dialog','content').contains(document.activeElement),'Opening requests focus inside dialog (simulated DOM)')
  await key('Escape',{isComposing:true});assert.equal(trigger.getAttribute('aria-expanded'),'true','IME composition Escape must not dismiss')
  const select=part('select','trigger');select.focus();select.click();await settle()
  assert.equal(select.getAttribute('aria-expanded'),'true')
  await key('Escape');assert.equal(select.getAttribute('aria-expanded'),'false','First Escape dismisses child Select')
  assert.equal(trigger.getAttribute('aria-expanded'),'true','Child Escape must not dismiss parent dialog')
  await key('Escape');assert.equal(trigger.getAttribute('aria-expanded'),'false','Second Escape dismisses parent')
  assert.equal(document.activeElement,trigger,'Close requests return focus to dialog trigger')
  trigger.focus();trigger.click();await settle();part('dialog','close-trigger').click();await settle()
  assert.equal(document.activeElement,trigger,'Close button also restores trigger focus')
  trigger.focus();trigger.click();await settle()
  assert.equal(trigger.getAttribute('aria-expanded'),'true')
  assert.equal(document.body.style.pointerEvents,'none','Open modal installs pointer blocking')
  assert.equal(document.body.style.overflow,'hidden','Open modal installs scroll lock')
  assert.equal(background.getAttribute('aria-hidden'),'true','Open modal hides background from accessibility tree')
  await cleanup();await settle()
  assert.equal(document.body.style.pointerEvents,baseline.pointerEvents,'Unmount restores global pointer events')
  assert.equal(document.body.style.overflow,baseline.overflow,'Unmount restores scroll lock')
  assert.equal(background.getAttribute('aria-hidden'),baseline.ariaHidden,'Unmount restores background aria-hidden')
  const freshCleanup=run(target);await settle()
  const freshTrigger=part('dialog','trigger');freshTrigger.focus();freshTrigger.click();await settle()
  assert.equal(freshTrigger.getAttribute('aria-expanded'),'true','New dialog can open after active modal unmount')
  await key('Escape');assert.equal(freshTrigger.getAttribute('aria-expanded'),'false','No stale layer blocks new dialog Escape')
  assert.equal(document.activeElement,freshTrigger,'New dialog restores focus after prior trap disposal')
  await freshCleanup();await win.happyDOM.close();console.log('PASS keyboard contracts')
} else for(const framework of ['react','solid','vue','svelte']) test(`Ready ${framework}: simulated dialog focus and nested Select Escape`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-keyboard-'))
 try{
 let plugin,code;const source=`${root}packages/ready/${framework}`
 if(framework==='react'){
 plugin=(await import('@vitejs/plugin-react')).default()
 code=`import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {Dialog,Select} from '${source}';export function run(target){const root=createRoot(target);root.render(h(Dialog,{trigger:'Open',title:'Preferences'},h(Select,{label:'Plan',options:[{label:'A',value:'a'},{label:'B',value:'b'}]})));return()=>root.unmount()}`
 }else if(framework==='solid'){
 plugin=(await import('vite-plugin-solid')).default()
 code=`import {render} from 'solid-js/web';import {createComponent as h} from 'solid-js';import {Dialog,Select} from '${source}';export function run(target){return render(()=>h(Dialog,{trigger:'Open',title:'Preferences',get children(){return h(Select,{label:'Plan',options:[{label:'A',value:'a'},{label:'B',value:'b'}]})}}),target)}`
 }else if(framework==='vue'){
 plugin=(await import('@vitejs/plugin-vue')).default()
 code=`import {createApp,h} from 'vue';import {Dialog,Select} from '${source}';export function run(target){const app=createApp({render:()=>h(Dialog,{trigger:'Open',title:'Preferences'},{default:()=>h(Select,{label:'Plan',options:[{label:'A',value:'a'},{label:'B',value:'b'}]})})});app.mount(target);return()=>app.unmount()}`
 }else{
 plugin=(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
 await writeFile(join(folder,'Fixture.svelte'),`<script>import {Dialog,Select} from '${source}';</script><Dialog trigger="Open" title="Preferences"><Select label="Plan" options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/></Dialog>`)
 code=`import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target){const app=mount(Fixture,{target});return()=>unmount(app)}`
 }
    const entry = join(folder, 'entry.mjs'); await writeFile(entry, code)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS keyboard contracts/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
