import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))
if (process.argv[2] === '--server') {
  assert.equal(typeof window, 'undefined', 'SSR is executed without DOM globals')
  assert.equal(typeof document, 'undefined', 'SSR is executed without document')
  const warnings=[];const original={warn:console.warn,error:console.error}
  console.warn=(...args)=>warnings.push(args.map(String).join(' '));console.error=(...args)=>warnings.push(args.map(String).join(' '))
  const { render } = await import(pathToFileURL(process.argv[3]))
  const html=await render();console.warn=original.warn;console.error=original.error
  assert.deepEqual(warnings,[],'Server rendering emits no warnings')
  await writeFile(process.argv[4], html)
} else if (process.argv[2] === '--client') {
  const { Window } = await import('happy-dom'); const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) if (['window','document','navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) { try { Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]}) } catch {} }
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key]=win[key].bind(win)
  const initiallyHasHelper=process.argv[5]==='with-helper';
  const target=document.createElement('div');target.innerHTML=await readFile(process.argv[4],'utf8');document.body.append(target)
  const nodes=[...target.querySelectorAll('[id]')],ids=nodes.map(n=>n.id),empty=target.querySelector('.rd-empty'),originalHelper=target.querySelector('[data-part=helper-text]'),error=target.querySelector('.rd-error'),select=target.querySelector('select'),trigger=target.querySelector('[data-part=trigger]');
  let helper=originalHelper;assert.equal(Boolean(helper),initiallyHasHelper);
  assert.equal(new Set(ids).size,ids.length);assert.equal(empty.textContent,'暂无选项');
  const check=expected=>{for(const id of expected)assert.ok(document.getElementById(id),`Description exists: ${id}`);for(const node of [select,trigger])assert.deepEqual(new Set(node.getAttribute('aria-describedby').split(/\s+/)),new Set(expected));assert.equal(select.value,'');assert.deepEqual([...new win.FormData(target.querySelector('form'))],[['plan','']])};
  // Current primitive Field registers helper presence after mount, not during SSR.
  // Own Ready error/empty associations must already exist in server HTML.
  check([error.id,empty.id]);
  const warnings=[];const original={warn:console.warn,error:console.error};console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '));
  const {hydrate}=await import(pathToFileURL(process.argv[3]));const cleanup=hydrate(target,warnings);const settle=()=>new Promise(r=>setTimeout(r,150));await settle();
  assert.deepEqual([...target.querySelectorAll('[id]')].map(n=>n.id),ids);nodes.forEach((node,i)=>assert.equal(node,target.querySelectorAll('[id]')[i]));check([...(helper?[helper.id]:[]),error.id,empty.id]);
  // Dynamic presence is tracked after child mount/unmount; own Ready IDs remain intact.
  for(const show of (initiallyHasHelper?[false,true,false,true]:[true,false,true])){target.querySelector('[data-toggle-helper]').click();await settle();helper=target.querySelector('[data-part=helper-text]');assert.equal(Boolean(helper),show);check([...(helper?[helper.id]:[]),error.id,empty.id]);assert.equal(empty,target.querySelector('.rd-empty'));assert.equal(error,target.querySelector('.rd-error'));assert.equal(select,target.querySelector('select'));}
  target.querySelector('[data-load]').click();await settle();assert.equal(target.querySelector('.rd-empty'),null);assert.equal(select,target.querySelector('select'));assert.equal(trigger,target.querySelector('[data-part=trigger]'));assert.equal(helper,target.querySelector('[data-part=helper-text]'));assert.equal(error,target.querySelector('.rd-error'));check([helper.id,error.id]);assert.equal(target.querySelector('[data-count]').textContent,'0');assert.deepEqual(warnings,[]);
  await cleanup();await win.happyDOM.close();console.warn=original.warn;console.error=original.error;console.log('PASS real SSR and simulated hydration')
} else for(const framework of ['react','vue']) for(const helperMode of ['with-helper','without-helper']) test(`Ready ${framework}: real SSR to simulated hydration (empty translated collection, ${helperMode})`,{timeout:120000},async()=>{
  const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
  try{
    const source=`${root}packages/ready/${framework}`
    let plugin,server,client
    if(framework==='react'){
      plugin=(await import('@vitejs/plugin-react')).default()
      await writeFile(join(folder,'App.tsx'),`import {useState} from 'react';import {Field} from '@destyler-ui/react';import {Select} from '${source}';export default function App(){const [options,set]=useState([]),[count,setCount]=useState(0),[showHelper,setShowHelper]=useState(${helperMode==='with-helper'});return <form><Field.Root>{showHelper && <Field.HelperText>Helper</Field.HelperText>}<Select label="方案" name="plan" error="Invalid" emptyMessage="暂无选项" options={options} onValueChange={()=>setCount(v=>v+1)}/></Field.Root><button type="button" data-toggle-helper onClick={()=>setShowHelper(v=>!v)}>Toggle helper</button><button type="button" data-load onClick={()=>set([{label:'A',value:'a'}])}>Load</button><span data-count>{count}</span></form>}`)
      server=`import {createElement} from 'react';import {renderToString} from 'react-dom/server';import App from './App';export const render=()=>renderToString(createElement(App),{identifierPrefix:'ready-'})`
      client=`import {createElement} from 'react';import {hydrateRoot} from 'react-dom/client';import App from './App';export function hydrate(target,warnings){const root=hydrateRoot(target,createElement(App),{identifierPrefix:'ready-',onRecoverableError:error=>warnings.push(String(error))});return()=>root.unmount()}`
    }else{
      plugin=(await import('@vitejs/plugin-vue')).default()
      await writeFile(join(folder,'App.vue'),`<script setup>import {ref} from 'vue';import {Field} from '@destyler-ui/vue';import {Select} from '${source}';const options=ref([]),count=ref(0),showHelper=ref(${helperMode==='with-helper'})</script><template><form><Field.Root><Field.HelperText v-if="showHelper">Helper</Field.HelperText><Select label="方案" name="plan" error="Invalid" empty-message="暂无选项" :options="options" @value-change="count++"/></Field.Root><button type="button" data-toggle-helper @click="showHelper=!showHelper">Toggle helper</button><button type="button" data-load @click="options=[{label:'A',value:'a'}]">Load</button><span data-count>{{count}}</span></form></template>`)
      server=`import {createSSRApp} from 'vue';import {renderToString} from '@vue/server-renderer';import App from './App.vue';export function render(){const app=createSSRApp(App);app.config.idPrefix='ready';return renderToString(app)}`
      client=`import {createSSRApp} from 'vue';import App from './App.vue';export function hydrate(target,warnings){const app=createSSRApp(App);app.config.idPrefix='ready';app.config.warnHandler=message=>warnings.push(message);app.mount(target);return()=>app.unmount()}`
    }
    const {build}=await import('vite')
    await writeFile(join(folder,'server.mjs'),server);await writeFile(join(folder,'client.mjs'),client)
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:join(folder,'server.mjs'),outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
    const html=join(folder,'ssr.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/server.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'client'),minify:false,lib:{entry:join(folder,'client.mjs'),formats:['es'],fileName:()=> 'client.mjs'}}})
    const output=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/client.mjs'),html,helperMode],{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,/PASS real SSR/)
  }finally{await rm(folder,{recursive:true,force:true})}
})
