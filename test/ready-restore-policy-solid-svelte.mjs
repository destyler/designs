// Opt-in application policy experiment: node --test test/ready-restore-policy-solid-svelte.mjs
// Does not change Ready defaults or implement uncontrolled restoration.
import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {join} from 'node:path'
import {runInThisContext} from 'node:vm'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--server'){
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 const warnings=[];console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '));
 const {html,bootstrap}=await import(pathToFileURL(process.argv[3]));await writeFile(process.argv[4],html());assert.deepEqual(warnings,[],'SSR warnings');if(bootstrap)await writeFile(process.argv[4]+'.js',bootstrap.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
}else if(process.argv[2]==='--client'){
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
 globalThis.window=win;globalThis.document=win.document
 const target=document.createElement('main');document.body.append(target);target.innerHTML=await readFile(process.argv[4],'utf8')
 const scenario=process.argv[6];const events=[];globalThis.__readyEvents=events;globalThis.__restoreControllers={}
 const read=()=>Object.fromEntries([...target.querySelectorAll('[data-field-key]')].map(wrapper=>{const control=wrapper.querySelector('input,select');return [wrapper.dataset.fieldKey,control.tagName==='INPUT'?control.checked:control.value]}))
 const baseline=read(),nodes=[...target.querySelectorAll('input,select')],ids=[...target.querySelectorAll('[id]')].map(n=>n.id)
 assert.equal(target.querySelectorAll('form').length,1)
 assert.equal(target.querySelectorAll('[name=check]').length,2,'Repeated names in same form')
 assert.equal(target.querySelectorAll('[name=choice]').length,2)
 const field=key=>[...target.querySelectorAll('[data-field-key]')].find(e=>e.dataset.fieldKey===key).querySelector('input,select')
 field('controlled-check').checked=true;field('controlled-choice').value='b'
 field('controlled-empty-check').checked=true;field('controlled-empty-choice').value='a'
 const captured=read()
 if(scenario==='stale'){field('controlled-check').checked=false;field('controlled-choice').value='a'}
 // Compare immediately before hydration, not only when capturing. Entire batch is
 // paused when stale; detecting newer edits is not permission to discard them.
 const current=read(),stale=JSON.stringify(current)!==JSON.stringify(captured)
 const accept=['accept','late-edit'].includes(scenario)&&!stale
 assert.equal(stale,scenario==='stale')
 if(stale){
  // Stop before importing/starting the client runtime: no reconciliation or reset.
  // Native values survive, but custom controls remain inert SSR until the app
  // recaptures and gets a business decision. This is an availability tradeoff.
  assert.deepEqual(read(),current);assert.deepEqual(events,[]);assert.equal(Object.keys(globalThis.__restoreControllers).length,0)
  const after=[...target.querySelectorAll('input,select')];nodes.forEach((n,i)=>assert.equal(after[i],n));assert.deepEqual([...target.querySelectorAll('[id]')].map(n=>n.id),ids)
  assert.deepEqual([...new win.FormData(target.querySelector('form'))],[['choice','a'],['check','on'],['choice','a']])
  console.log(JSON.stringify({scenario,baseline,captured,prehydrate:current,stale,hydrated:false,preserved:read(),blocked:'New edits detected; recapture and obtain an application decision. SSR custom controls remain unhydrated.'}))
  await win.happyDOM.close();console.log('PASS restoration policy experiment')
 }else{
 const restored=accept?Object.fromEntries(['controlled','controlled-empty'].map(key=>[key,{checked:captured[key+'-check'],value:captured[key+'-choice']}])):{}
 const warnings=[],warn=console.warn,error=console.error;console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '))
 if(process.argv[5]==='solid')runInThisContext(await readFile(process.argv[4]+'.js','utf8'))
 let lateEdit=null
 // Deterministic hook fault injection, not evidence of real-browser timing.
 globalThis.__beforeAdopt=()=>{if(scenario==='late-edit'&&!lateEdit){field('controlled-check').checked=false;field('controlled-choice').value='a';lateEdit=read()}}
 const {run}=await import(pathToFileURL(process.argv[3]));const cleanup=run(target,restored)
 const eventually=async fn=>{const end=Date.now()+2000;for(;;){try{fn();return}catch(e){if(Date.now()>end)throw e;await new Promise(r=>setTimeout(r,10))}}}
 await eventually(()=>assert.equal(Object.keys(globalThis.__restoreControllers).length,2))
 // Explicit application rejection policy: authoritative original state wins.
 // This is deliberately not run by the component or for accepted restoration.
 const reconcile=values=>{for(const [key,value] of Object.entries(values)){const control=field(key);if(control.tagName==='INPUT')control.checked=value;else control.value=value}}
 if(scenario==='reject')reconcile(baseline)
 const assertState=values=>{assert.deepEqual(read(),values);for(const scope of target.querySelectorAll('[data-mode]')){const key=scope.dataset.mode;assert.equal(scope.querySelector('[data-part=control][data-scope=checkbox]').dataset.state,values[key+'-check']?'checked':'unchecked');assert.equal(scope.querySelector('[data-part=value-text]').textContent,values[key+'-choice']?values[key+'-choice'].toUpperCase():'Choose an option')}
 const formData=[...new win.FormData(target.querySelector('form'))];const expected=[];for(const key of ['controlled','controlled-empty']){if(values[key+'-check'])expected.push(['check','on']);expected.push(['choice',values[key+'-choice']])}assert.deepEqual(formData,expected)}
 await eventually(()=>assertState(accept?captured:baseline))
 if(scenario==='late-edit'){assert.ok(lateEdit);assert.equal(lateEdit['controlled-check'],false);assert.equal(lateEdit['controlled-choice'],'a');assert.equal(read()['controlled-check'],true);assert.equal(read()['controlled-choice'],'b');console.log('KNOWN GAP (hook fault injection, not browser timing proof): A property-only edit after hydrate starts but before onMount adoption is overwritten. Prehydrate comparison does not solve this window; input/change listeners cannot detect all silent property restoration.')}

 assert.deepEqual(events,[],'Explicit restoration/rejection is not a fabricated user callback')
 const after=[...target.querySelectorAll('input,select')];nodes.forEach((n,i)=>assert.equal(after[i],n));assert.deepEqual([...target.querySelectorAll('[id]')].map(n=>n.id),ids)
 // Application owns reset policy: cancel native reset and restore original SSR
 // state through the parent, not the adapter's currently selected reset defaults.
 const form=target.querySelector('form');form.addEventListener('reset',event=>{event.preventDefault();for(const reset of Object.values(globalThis.__restoreControllers))reset();queueMicrotask(()=>reconcile(baseline))})
 form.reset();await eventually(()=>assertState(baseline));assert.deepEqual(events,[])
 await cleanup();console.warn=warn;console.error=error;assert.deepEqual(warnings,[]);await win.happyDOM.close()
 console.log(JSON.stringify({scenario,baseline,captured,prehydrate:current,stale,lateEdit,accepted:accept,reset:'original SSR baseline',warnings}))
 console.log('PASS restoration policy experiment')
 }
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} opt-in stable-field restoration policy`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
 try{
 const {build}=await import('vite');let server,client
 if(framework==='solid'){
 await writeFile(join(folder,'Fixture.tsx'),`import {createSignal,onMount} from 'solid-js';import {Checkbox,Select} from '${root}packages/ready/solid';export default function App({restored={}}={}){return <form>{['controlled','controlled-empty'].map(mode=>{const [checked,setChecked]=createSignal(false);const [value,setValue]=createSignal(mode==='controlled'?'a':'');onMount(()=>{globalThis.__beforeAdopt?.();if(restored[mode]){setChecked(restored[mode].checked);setValue(restored[mode].value)}});onMount(()=>{globalThis.__restoreControllers[mode]=()=>{setChecked(false);setValue(mode==='controlled'?'a':'')}});const emit=(type,v)=>globalThis.__readyEvents?.push([mode,type,v]);return <section data-mode={mode}><div data-field-key={mode+'-check'}><Checkbox name="check" label="Check" checked={checked()} onCheckedChange={v=>{emit('checked',v);setChecked(v)}}/></div><div data-field-key={mode+'-choice'}><Select name="choice" label="Choice" value={value()} onValueChange={v=>{emit('value',v);setValue(v)}} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/></div></section>})}</form>}`)
 server=`import {renderToString,generateHydrationScript} from 'solid-js/web';import App from './Fixture';export const html=()=>renderToString(()=>App());export const bootstrap=generateHydrationScript();`
 client=`import {hydrate} from 'solid-js/web';import App from './Fixture';export const run=(target,restored)=>hydrate(()=>App({restored}),target);`
 }else{
 await writeFile(join(folder,'Scope.svelte'),`<script>import {onMount} from 'svelte';import {Checkbox,Select} from '${root}packages/ready/svelte';let {mode,restored}=$props();let checked=$state(false),value=$state(mode==='controlled'?'a':'');onMount(()=>{globalThis.__beforeAdopt?.();if(restored){checked=restored.checked;value=restored.value}globalThis.__restoreControllers[mode]=()=>{checked=false;value=mode==='controlled'?'a':''}});const emit=(type,v)=>globalThis.__readyEvents?.push([mode,type,v]);</script><section data-mode={mode}><div data-field-key={mode+'-check'}><Checkbox name="check" label="Check" {checked} onCheckedChange={v=>{emit('checked',v);checked=v}}/></div><div data-field-key={mode+'-choice'}><Select name="choice" label="Choice" {value} onValueChange={v=>{emit('value',v);value=v}} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/></div></section>`)
 await writeFile(join(folder,'Fixture.svelte'),`<script>import Scope from './Scope.svelte';let {restored={}}=$props();</script><form><Scope mode="controlled" restored={restored.controlled}/><Scope mode="controlled-empty" restored={restored['controlled-empty']}/></form>`)
 server=`import {render} from 'svelte/server';import App from './Fixture.svelte';export const html=()=>render(App).body;`
 client=`import {hydrate,unmount} from 'svelte';import App from './Fixture.svelte';export const run=(target,restored)=>{const app=hydrate(App,{target,props:{restored},recover:false});return ()=>unmount(app)};`
 }
 for(const mode of ['server','client']){
 const entry=join(folder,mode+'.mjs');await writeFile(entry,mode==='server'?server:client)
 const plugin=framework==='solid'?(await import('vite-plugin-solid')).default({ssr:true}):(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],ssr:{noExternal:true},build:{ssr:mode==='server'?entry:false,outDir:join(folder,mode),minify:false,lib:mode==='client'?{entry,formats:['es'],fileName:()=> 'entry.mjs'}:undefined,rollupOptions:{output:{entryFileNames:'entry.mjs',inlineDynamicImports:true}}}})
 }
 const html=join(folder,'ssr.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/entry.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
 for(const scenario of ['accept','stale','reject','late-edit']){const result=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/entry.mjs'),html,framework,scenario],{cwd:root,encoding:'utf8',timeout:30000});console.log(framework,result);assert.match(result,/PASS restoration policy experiment/)}
 }finally{await rm(folder,{recursive:true,force:true})}
})
