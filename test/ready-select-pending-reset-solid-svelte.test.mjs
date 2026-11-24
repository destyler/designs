// Pending requested values remain the primitive reset baseline; canceled path dispatches the reset event only because HappyDOM native cancellation mutates first.
import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {join} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--worker'){
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
 globalThis.window=win;globalThis.document=win.document
 const {run}=await import(pathToFileURL(process.argv[3]));const pause=()=>new Promise(r=>setTimeout(r,100));
 for(const mode of ['pristine','accept','refuse','pending','cancel']){
 const target=document.createElement('form');document.body.append(target);const events=[];const api=run(target,['accept','pending'].includes(mode),v=>events.push(v));await pause();api.load(mode!=='pending');await pause();if(mode!=='pristine'){api.value('a');await pause()}const before=target.querySelector('select').value;assert.equal(before,mode==='pristine'?'b':'a')
 if(mode==='cancel'){target.addEventListener('reset',e=>e.preventDefault(),{once:true});target.dispatchEvent(new win.Event('reset',{bubbles:true,cancelable:true}))}else target.reset()
 await pause();const expected=mode==='pending'?'':mode==='accept'||mode==='pristine'?'b':'a';assert.equal(target.querySelector('select').value,expected);assert.equal(target.querySelector('[data-part=value-text]').textContent,expected?expected.toUpperCase():'Choose an option');assert.deepEqual([...new win.FormData(target)],[['choice',expected]]);assert.deepEqual(events,['pristine','cancel'].includes(mode)?[]:['b']);if(mode==='pending'){api.load();await pause();assert.equal(target.querySelector('select').value,'b');assert.deepEqual(events,['b'])}
 await api.cleanup();target.remove()
 }
 await win.happyDOM.close()
}else for(const framework of ['solid','svelte'])test(`Pending reset baseline regression ${framework}`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-pending-reset-'));try{const {build}=await import('vite');let plugin,code
 if(framework==='solid'){plugin=(await import('vite-plugin-solid')).default();code=`import {render} from 'solid-js/web';import {createComponent,createSignal} from 'solid-js';import {Select} from '${root}packages/ready/solid';export function run(target,accept,change){const [value,setValue]=createSignal('b'),[options,setOptions]=createSignal([]);const cleanup=render(()=>createComponent(Select,{label:'Choice',name:'choice',get value(){return value()},get options(){return options()},onValueChange:v=>{change(v);if(accept)setValue(v)}}),target);return{value:setValue,load:(includeB=true)=>setOptions(includeB?[{label:'A',value:'a'},{label:'B',value:'b'}]:[{label:'A',value:'a'}]),cleanup}}`
 }else{plugin=(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false});await writeFile(join(folder,'Fixture.svelte'),`<script>import {Select} from '${root}packages/ready/svelte';let {accept,change}=$props();let value=$state('b'),options=$state([]);export function setValue(v){value=v}export function load(includeB=true){options=includeB?[{label:'A',value:'a'},{label:'B',value:'b'}]:[{label:'A',value:'a'}]}</script><Select label="Choice" name="choice" {value} {options} onValueChange={v=>{change(v);if(accept)value=v}}/>`);code=`import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,accept,change){const app=mount(Fixture,{target,props:{accept,change}});return{value:app.setValue,load:app.load,cleanup:()=>unmount(app)}}`}
 const entry=join(folder,'entry.mjs');await writeFile(entry,code);await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}});console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}))
 }finally{await rm(folder,{recursive:true,force:true})}
})
