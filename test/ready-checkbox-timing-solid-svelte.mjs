// Opt-in timing investigation; synchronous snapshots are deliberately not inferred from settled state.
// Stable-state native/visible/form regression. Synthetic Space is a simulator limitation, not browser activation proof.
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
 const {run}=await import(pathToFileURL(process.argv[3]));const pause=()=>new Promise(r=>setTimeout(r,100));const records=[]
 for(const accept of [true,false])for(const initial of [false,true]){
 const form=document.createElement('form');document.body.append(form);const phases=[];let api
 const snapshot=(phase,proposal,parent)=>{const input=form.querySelector('input');phases.push({phase,proposal,parent:parent??api?.parent(),native:input.checked,visual:form.querySelector('[data-part=control]').dataset.state,data:[...new win.FormData(form)]})}
 api=run(form,accept,initial,(proposal,parent,phase='callback-before-parent-decision')=>{snapshot(phase,proposal,parent)});await pause()
 snapshot('before-click');form.querySelector('input').click();snapshot('click-return');await Promise.resolve();snapshot('one-microtask');await pause();snapshot('settled');records.push({accept,initial,phases});await api.cleanup();form.remove()
 }
 const native=[]
 for(const cancel of [false,true])for(const initial of [false,true]){
 const form=document.createElement('form');form.innerHTML='<input name="check" type="checkbox">';document.body.append(form);const input=form.firstElementChild;input.checked=initial;const phases=[];const snap=phase=>phases.push({phase,checked:input.checked,data:[...new win.FormData(form)]})
 for(const event of ['click','input','change'])input.addEventListener(event,e=>{snap(event+'-listener-before-cancel');if(event==='click'&&cancel){e.preventDefault();snap('click-listener-after-cancel')}})
 snap('before-click');input.click();snap('click-return');await Promise.resolve();snap('one-microtask');await pause();snap('settled');native.push({cancel,initial,phases});form.remove()
 }
 console.log(JSON.stringify({records,native,limitations:'HappyDOM event timing, not browser submit timing. Native preventDefault is not the controlled-parent refusal contract.'}));await win.happyDOM.close()
}else for(const framework of ['solid','svelte'])test(`Checkbox callback FormData timing investigation ${framework}`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-checkbox-audit-'));try{const {build}=await import('vite');let plugin,code
 if(framework==='solid'){plugin=(await import('vite-plugin-solid')).default();code=`import {render} from 'solid-js/web';import {createComponent,createSignal} from 'solid-js';import {Checkbox} from '${root}packages/ready/solid';export function run(target,accept,initial,change){const [checked,set]=createSignal(initial);const cleanup=render(()=>createComponent(Checkbox,{label:'Check',name:'check',get checked(){return checked()},onCheckedChange:v=>{change(v,checked());if(accept)set(v);change(v,checked(),'callback-after-parent-decision')}}),target);return{parent:checked,cleanup}}`
 }else{plugin=(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false});await writeFile(join(folder,'Fixture.svelte'),`<script>import {Checkbox} from '${root}packages/ready/svelte';let {accept,initial,change}=$props();let checked=$state(initial);export function parent(){return checked}</script><Checkbox label="Check" name="check" {checked} onCheckedChange={v=>{change(v,checked);if(accept)checked=v;change(v,checked,'callback-after-parent-decision')}}/>`);code=`import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,accept,initial,change){const app=mount(Fixture,{target,props:{accept,initial,change}});return{parent:app.parent,cleanup:()=>unmount(app)}}`}
 const entry=join(folder,'entry.mjs');await writeFile(entry,code);await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}});console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}))
 }finally{await rm(folder,{recursive:true,force:true})}
})
