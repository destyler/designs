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
 const {run}=await import(pathToFileURL(process.argv[3]));const settle=()=>new Promise(r=>setTimeout(r,100));const records=[]
 for(const mode of ['accept','refuse','uncontrolled'])for(const initial of mode==='uncontrolled'?[false]:[false,true]){
  const form=document.createElement('form');document.body.append(form);const events=[];const api=run(form,mode,initial,v=>events.push(v));await settle();const input=form.querySelector('input');const control=form.querySelector('[data-part=control]');const label=form.querySelector('[data-part=label]')
  const snap=()=>({native:input.checked,visual:control.dataset.state,submitted:new win.FormData(form).has('check'),required:input.required,disabled:input.disabled,valid:input.checkValidity(),events:[...events]})
  let expectedChecked=mode==='uncontrolled'?false:initial
  const steps=[];const action=async(name,fn)=>{const before=expectedChecked;let expectedEvents=[];if(name.includes('-click-')){expectedEvents=[!before];if(mode!=='refuse')expectedChecked=!before}else if(name.startsWith('reset-')&&name!=='reset-cancel-event'){const baseline=mode==='uncontrolled'?false:initial;if(before!==baseline)expectedEvents=[baseline];if(mode!=='refuse')expectedChecked=baseline}
   events.length=0;fn();const immediate=snap();await settle();const stable=snap();const disabled=name.startsWith('disabled-');assert.equal(stable.native,expectedChecked,mode+' '+name+' native');assert.equal(stable.visual,expectedChecked?'checked':'unchecked',mode+' '+name+' visual');assert.equal(stable.submitted,!disabled&&expectedChecked,mode+' '+name+' FormData');assert.equal(stable.valid,disabled||expectedChecked,mode+' '+name+' required validity');assert.deepEqual(stable.events,expectedEvents,mode+' '+name+' exact callbacks');steps.push({name,immediate,stable})}
  for(const [name,node] of [['input',input],['label',label],['control',control]])for(let repeat=0;repeat<2;repeat++)await action(name+'-click-'+repeat,()=>node.click())
  await action('Space-keydown-keyup',()=>{input.focus();input.dispatchEvent(new win.KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));input.dispatchEvent(new win.KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true,cancelable:true}))})
  api.disabled(true);await settle();for(const [name,node] of [['input',input],['label',label],['control',control]])await action('disabled-'+name,()=>node.click());api.disabled(false);await settle()
  if(mode==='uncontrolled'){input.click();expectedChecked=true}else{api.checked(!initial);expectedChecked=!initial}await settle()
  // HappyDOM form.reset mutates before cancellation. This explicitly tests only
  // the canceled reset event path, not native browser rollback.
  await action('reset-cancel-event',()=>{form.addEventListener('reset',e=>e.preventDefault(),{once:true});form.dispatchEvent(new win.Event('reset',{bubbles:true,cancelable:true}))})
  for(let repeat=0;repeat<2;repeat++)await action('reset-'+repeat,()=>form.reset())
  const inconsistent=steps.filter(({stable:s})=>s.native!==(s.visual==='checked')||s.submitted!==(!s.disabled&&s.native)||s.valid!==(!s.required||s.disabled||s.native))
  assert.deepEqual(inconsistent,[]);records.push({mode,initial,steps,inconsistent});await api.cleanup();form.remove()
 }
 const plain=document.createElement('form');plain.innerHTML='<label>Plain<input type="checkbox" required name="plain"></label>';document.body.append(plain);const native=plain.querySelector('input');native.dispatchEvent(new win.KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));native.dispatchEvent(new win.KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true,cancelable:true}));const spaceChecked=native.checked;plain.querySelector('label').click();const labelChecked=native.checked;assert.equal(spaceChecked,false,'Native HappyDOM control also lacks synthetic Space activation');assert.equal(labelChecked,true,'Native label click activates the control');console.log('PASS checkbox stable state, exact callbacks and reset; synthetic Space cannot verify browser default activation; canceled reset uses event-only model');await win.happyDOM.close()
}else for(const framework of ['solid','svelte'])test(`Checkbox native/visible controlled state regression ${framework}`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-checkbox-audit-'));try{const {build}=await import('vite');let plugin,code
 if(framework==='solid'){plugin=(await import('vite-plugin-solid')).default();code=`import {render} from 'solid-js/web';import {createComponent,createSignal} from 'solid-js';import {Checkbox} from '${root}packages/ready/solid';export function run(target,mode,initial,change){const [checked,set]=createSignal(initial),[disabled,setDisabled]=createSignal(false);const cleanup=render(()=>createComponent(Checkbox,{label:'Check',name:'check',required:true,get checked(){return mode==='uncontrolled'?undefined:checked()},get disabled(){return disabled()},onCheckedChange:v=>{change(v);if(mode==='accept')set(v)}}),target);return{checked:set,disabled:setDisabled,cleanup}}`
 }else{plugin=(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false});await writeFile(join(folder,'Fixture.svelte'),`<script>import {Checkbox} from '${root}packages/ready/svelte';let {mode,initial,change}=$props();let checked=$state(initial),disabled=$state(false);export function setChecked(v){checked=v}export function setDisabled(v){disabled=v}</script><Checkbox label="Check" name="check" required checked={mode==='uncontrolled'?undefined:checked} {disabled} onCheckedChange={v=>{change(v);if(mode==='accept')checked=v}}/>`);code=`import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,mode,initial,change){const app=mount(Fixture,{target,props:{mode,initial,change}});return{checked:app.setChecked,disabled:app.setDisabled,cleanup:()=>unmount(app)}}`}
 const entry=join(folder,'entry.mjs');await writeFile(entry,code);await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}});console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}))
 }finally{await rm(folder,{recursive:true,force:true})}
})
