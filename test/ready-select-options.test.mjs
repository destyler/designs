import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
const source=await readFile(new URL('../packages/ready/select-options.ts',import.meta.url),'utf8')
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}})
const {validateSelectOptions}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'))
const root=fileURLToPath(new URL('../',import.meta.url))
const message='Ready Select: option.value must not be empty; empty string is reserved for no selection.'
if(process.argv[2]==='--worker') {
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
 globalThis.window=win;globalThis.document=win.document
 const {run}=await import(pathToFileURL(process.argv[3]));const settle=()=>new Promise(r=>setTimeout(r,100));const valid=[{label:'Zero',value:'0'},{label:'Space',value:' '}]
 for(const mode of ['legal','initial-empty','initial-disabled','dynamic-empty','dynamic-disabled']){
  const form=document.createElement('form');document.body.append(form);const errors=[];const changes=[];const bad={label:'Reserved',value:'',disabled:mode.endsWith('disabled')};let api
  try {api=run(form,mode.startsWith('initial')?[...valid,bad]:valid,e=>errors.push(e),v=>changes.push(v))}catch(error){errors.push(error)}
  await settle()
  if(mode==='legal'){
   for(const [value,label] of [['0','Zero'],[' ','Space']]){
    form.querySelector('[data-part="trigger"]').click();await settle();const item=[...form.querySelectorAll('[data-part="item"]')].find(n=>n.getAttribute('data-value')===value);assert.ok(item);item.click();await settle();assert.equal(form.querySelector('[data-part="value-text"]').textContent,label);assert.equal(form.querySelector('select').value,value);assert.equal(new win.FormData(form).get('choice'),value)
   }
   assert.deepEqual(changes,['0',' ']);assert.deepEqual(errors,[])
  }else{
   if(mode.startsWith('dynamic')){try{api.update([...valid,bad])}catch(error){errors.push(error)}await settle()}
   assert.ok(errors.some(e=>e.message===message),`${mode}: expected explicit empty-option error, got ${errors.map(e=>e.message)}`)
  }
  if(api)await api.cleanup();form.remove();await settle()
 }
 await win.happyDOM.close();console.log('PASS Select reserved empty value')
}else{
 test('Select validator rejects only empty values without filtering or trimming',()=>{const options=[{label:'Zero',value:'0'},{label:'Space',value:' '}];assert.equal(validateSelectOptions(options),options);for(const disabled of [false,true])assert.throws(()=>validateSelectOptions([{label:'Bad',value:'',disabled}]),{message})})
 test('Select validation helper is included in the source package whitelist',async()=>{const pkg=JSON.parse(await readFile(new URL('../packages/ready/package.json',import.meta.url),'utf8'));assert.ok(pkg.files.includes('select-options.ts'))})
 for(const framework of ['react','solid','vue','svelte'])test(`Ready ${framework} Select rejects initial/dynamic empty options and preserves nonempty values`,{timeout:120000},async()=>{
  const folder=await mkdtemp(join(root,'node_modules/.ready-options-'))
  try{
   const {build}=await import('vite');let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default();code=`import {createElement,useState} from 'react';import {createRoot} from 'react-dom/client';import {Select} from '${root}packages/ready/react';export function run(target,options,error,change){let update;function App(){const [o,set]=useState(options);update=set;return createElement(Select,{label:'Choice',name:'choice',options:o,onValueChange:change})}const r=createRoot(target,{onUncaughtError:error});r.render(createElement(App));return{update:o=>update(o),cleanup:()=>r.unmount()}}`
   }else if(framework==='solid'){
    plugin=(await import('vite-plugin-solid')).default();code=`import {render} from 'solid-js/web';import {createComponent,createSignal,ErrorBoundary} from 'solid-js';import {Select} from '${root}packages/ready/solid';export function run(target,options,error,change){const [o,update]=createSignal(options);const cleanup=render(()=>createComponent(ErrorBoundary,{fallback:e=>{error(e);return null},get children(){return createComponent(Select,{label:'Choice',name:'choice',get options(){return o()},onValueChange:change})}}),target);return{update,cleanup}}`
   }else if(framework==='vue'){
    plugin=(await import('@vitejs/plugin-vue')).default();code=`import {createApp,h,ref} from 'vue';import {Select} from '${root}packages/ready/vue';export function run(target,options,error,change){const o=ref(options);const app=createApp({render:()=>h(Select,{label:'Choice',name:'choice',options:o.value,onValueChange:change})});app.config.errorHandler=error;app.mount(target);return{update:v=>o.value=v,cleanup:()=>app.unmount()}}`
   }else{
    plugin=(await import('@sveltejs/vite-plugin-svelte')).svelte();await writeFile(join(folder,'Fixture.svelte'),`<script>import Select from '${root}packages/ready/svelte/Select.svelte';let {initial,error,change}=$props();let options=$state(initial);export function update(next){options=next}</script><svelte:boundary onerror={error}><Select label="Choice" name="choice" {options} onValueChange={change}/></svelte:boundary>`);code=`import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,options,error,change){const app=mount(Fixture,{target,props:{initial:options,error,change}});return{update:app.update,cleanup:()=>unmount(app)}}`
   }
   const entry=join(folder,'entry.mjs');await writeFile(entry,code);await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}});const out=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000});assert.match(out,/PASS Select reserved/)
  }finally{await rm(folder,{recursive:true,force:true})}
 })
}
