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
  const initialDescription=process.argv[5]==='absent'?undefined:'  帮助说明  ';
  const target=document.createElement('div');target.innerHTML=await readFile(process.argv[4],'utf8');document.body.append(target)
  const firstNodes=[...target.querySelectorAll('[id]')],ids=firstNodes.map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
  const check=(text,hydrated)=>{for(const scope of target.querySelectorAll('[data-field]')){
   const description=scope.querySelector('.rd-description'),error=scope.querySelector('.rd-error'),empty=scope.querySelector('.rd-empty'),helper=scope.querySelector('[data-part=helper-text]');
   assert.equal(Boolean(description),Boolean(text?.trim()));if(description)assert.equal(description.textContent,text);
   const expected=[error.id,...(empty?[empty.id]:[]),...(description?[description.id]:[]),...(hydrated?[helper.id]:[])];
   for(const node of scope.querySelectorAll('input,select,[data-scope=checkbox][data-part=control],[data-scope=select][data-part=trigger]')){const actual=node.getAttribute('aria-describedby').split(/\s+/);assert.equal(new Set(actual).size,actual.length);assert.deepEqual(new Set(actual),new Set(expected));for(const id of actual)assert.ok(document.getElementById(id))}
  }};check(initialDescription,false);
  const warnings=[];const original={warn:console.warn,error:console.error};console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '));const {hydrate}=await import(pathToFileURL(process.argv[3]));const cleanup=hydrate(target,warnings);const settle=()=>new Promise(r=>setTimeout(r,150));await settle();
  check(initialDescription,true);assert.deepEqual([...target.querySelectorAll('[id]')].map(n=>n.id),ids);firstNodes.forEach((n,i)=>assert.equal(n,target.querySelectorAll('[id]')[i]));let descriptionIds=[...target.querySelectorAll('.rd-description')].map(n=>n.id);
  for(const [value,text] of [['empty',''],['space',' \t '],['missing',undefined],['translated','新说明'],['empty',''],['original','  帮助说明  ']]){target.querySelector(`[data-set=${value}]`).click();await settle();check(text,true);if(text?.trim()){const currentIds=[...target.querySelectorAll('.rd-description')].map(n=>n.id);if(!descriptionIds.length)descriptionIds=currentIds;assert.deepEqual(currentIds,descriptionIds)}}
  assert.equal(target.querySelector('[data-count]').textContent,'0');assert.deepEqual(warnings,[]);await cleanup();await win.happyDOM.close();console.warn=original.warn;console.error=original.error;console.log('PASS real SSR and simulated hydration')
} else for(const framework of ['react','vue']) for(const descriptionMode of ['present','absent']) test(`Ready ${framework}: real SSR to simulated hydration (owned descriptions ${descriptionMode})`,{timeout:120000},async()=>{
  const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
  try{
    const source=`${root}packages/ready/${framework}`
    let plugin,server,client
    if(framework==='react'){
      plugin=(await import('@vitejs/plugin-react')).default()
      await writeFile(join(folder,'App.tsx'),`import {useState} from 'react';import {Field} from '@destyler-ui/react';import {Checkbox,Select} from '${source}';export default function App(){const [description,set]=useState(${descriptionMode==='present'?JSON.stringify('  帮助说明  '):'undefined'}),[count,setCount]=useState(0);return <form>{['checkbox','select'].map(kind=><div data-field={kind} key={kind}><Field.Root><Field.HelperText>Helper</Field.HelperText>{kind==='checkbox'?<Checkbox label="同意" description={description} error="Invalid" onCheckedChange={()=>setCount(v=>v+1)}/>:<Select label="方案" description={description} error="Invalid" options={[]} onValueChange={()=>setCount(v=>v+1)}/>}</Field.Root></div>)}{Object.entries({empty:'',space:' \t ',missing:undefined,translated:'新说明',original:'  帮助说明  '}).map(([key,value])=><button key={key} type="button" data-set={key} onClick={()=>set(value)}>{key}</button>)}<span data-count>{count}</span></form>}`)
      server=`import {createElement} from 'react';import {renderToString} from 'react-dom/server';import App from './App';export const render=()=>renderToString(createElement(App),{identifierPrefix:'ready-'})`
      client=`import {createElement} from 'react';import {hydrateRoot} from 'react-dom/client';import App from './App';export function hydrate(target,warnings){const root=hydrateRoot(target,createElement(App),{identifierPrefix:'ready-',onRecoverableError:error=>warnings.push(String(error))});return()=>root.unmount()}`
    }else{
      plugin=(await import('@vitejs/plugin-vue')).default()
      await writeFile(join(folder,'App.vue'),`<script setup>import {ref} from 'vue';import {Field} from '@destyler-ui/vue';import {Checkbox,Select} from '${source}';const description=ref(${descriptionMode==='present'?JSON.stringify('  帮助说明  '):'undefined'}),count=ref(0);const values={empty:'',space:' \t ',missing:undefined,translated:'新说明',original:'  帮助说明  '}</script><template><form><div v-for="kind in ['checkbox','select']" :key="kind" :data-field="kind"><Field.Root><Field.HelperText>Helper</Field.HelperText><Checkbox v-if="kind==='checkbox'" label="同意" :description="description" error="Invalid" @checked-change="count++"/><Select v-else label="方案" :description="description" error="Invalid" :options="[]" @value-change="count++"/></Field.Root></div><button v-for="(value,key) in values" :key="key" type="button" :data-set="key" @click="description=value">{{key}}</button><span data-count>{{count}}</span></form></template>`)
      server=`import {createSSRApp} from 'vue';import {renderToString} from '@vue/server-renderer';import App from './App.vue';export function render(){const app=createSSRApp(App);app.config.idPrefix='ready';return renderToString(app)}`
      client=`import {createSSRApp} from 'vue';import App from './App.vue';export function hydrate(target,warnings){const app=createSSRApp(App);app.config.idPrefix='ready';app.config.warnHandler=message=>warnings.push(message);app.mount(target);return()=>app.unmount()}`
    }
    const {build}=await import('vite')
    await writeFile(join(folder,'server.mjs'),server);await writeFile(join(folder,'client.mjs'),client)
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:join(folder,'server.mjs'),outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
    const html=join(folder,'ssr.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/server.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'client'),minify:false,lib:{entry:join(folder,'client.mjs'),formats:['es'],fileName:()=> 'client.mjs'}}})
    const output=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/client.mjs'),html,descriptionMode],{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,/PASS real SSR/)
  }finally{await rm(folder,{recursive:true,force:true})}
})
