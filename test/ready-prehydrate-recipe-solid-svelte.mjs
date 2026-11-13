// Opt-in controlled application bootstrap prototype: node --test test/ready-prehydrate-recipe-solid-svelte.mjs
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
 const previousFocus=document.createElement('button');previousFocus.textContent='Before dialog';document.body.append(previousFocus)
 const target=document.createElement('main');document.body.append(target);target.innerHTML=await readFile(process.argv[4],'utf8')
 previousFocus.focus()
 const snapshots=[];const events=[];globalThis.__readyEvents=events
 const scopes=()=>[...document.querySelectorAll('[data-mode]')]
 const snapshot=phase=>{const state=scopes().map(s=>({mode:s.dataset.mode,checked:s.querySelector('input').checked,checkbox:s.querySelector('[data-scope=checkbox][data-part=control]').dataset.state,value:s.querySelector('select').value,label:s.querySelector('[data-part=value-text]').textContent,form:[...new win.FormData(s.querySelector('form'))]}));snapshots.push({phase,state,events:structuredClone(events)});return state}
 assert.equal(scopes().length,2)
 const server=snapshot('server');assert.deepEqual(server.map(s=>[s.checked,s.value]),[[false,'a'],[false,'']])
 for(const s of scopes()){s.querySelector('input').checked=true;s.querySelector('select').value='b'}
 assert.deepEqual(snapshot('native-edited-before-hydration').map(s=>[s.checked,s.value]),[[true,'b'],[true,'b']])
 // Application-specific scope/form/name addressing, not a global name map.
 const restored=Object.fromEntries(scopes().map(scope=>{const form=scope.querySelector('form');return [scope.dataset.mode,{checked:form.querySelector('input[name=check]').checked,value:form.querySelector('select[name=choice]').value}]}))
 const nodes=[...target.querySelectorAll('form,input,select')],ids=[...target.querySelectorAll('[id]')].map(n=>n.id)
 const warnings=[];const warn=console.warn,error=console.error;console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '))
 if(process.argv[5]==='solid')runInThisContext(await readFile(process.argv[4]+'.js','utf8'))
 const {run}=await import(pathToFileURL(process.argv[3]));const cleanup=run(target,restored)
 snapshot('hydrate-immediate')
 // Observe a stable result, not a claimed browser autofill timing contract.
 const waitForStable=async()=>{let last='',stableSince=Date.now();const deadline=Date.now()+2000
 while(Date.now()<deadline){await new Promise(r=>setTimeout(r,20));const current=JSON.stringify(scopes().map(s=>({checked:s.querySelector('input').checked,value:s.querySelector('select').value,label:s.querySelector('[data-part=value-text]').textContent,checkbox:s.querySelector('[data-scope=checkbox][data-part=control]').dataset.state,events})));if(current!==last){last=current;stableSince=Date.now()}else if(Date.now()-stableSince>=200)return}
 throw new Error('Observation did not settle within two seconds')}
 await waitForStable()
 const settled=snapshot('hydrate-settled')
 assert.deepEqual(settled.map(s=>[s.checked,s.checkbox,s.value,s.label,s.form]),Array.from({length:2},()=>[true,'checked','b','B',[['check','on'],['choice','b']]]))
 assert.deepEqual(events,[],'Parent bootstrap adoption does not fabricate user callbacks')
 const afterNodes=[...target.querySelectorAll('form,input,select')];assert.equal(afterNodes.length,nodes.length);nodes.forEach((n,i)=>assert.equal(afterNodes[i],n,'Original SSR node retained'))
 assert.deepEqual([...target.querySelectorAll('[id]')].map(n=>n.id),ids);assert.equal(new Set(ids).size,ids.length)
 for(const s of scopes()){
 s.querySelector('[data-scope=checkbox][data-part=control]').click();await waitForStable();snapshot(s.dataset.mode+'-first-checkbox-click')
 s.querySelector('[data-scope=select][data-part=trigger]').click();await waitForStable();[...s.querySelectorAll('[data-part=item]')].find(e=>e.querySelector('[data-part=item-text]')?.textContent==='A').click();await waitForStable();snapshot(s.dataset.mode+'-first-select-choice-a')
 }
 assert.deepEqual(snapshots.at(-1).state.map(s=>[s.checked,s.checkbox,s.value,s.label,s.form]),Array.from({length:2},()=>[false,'unchecked','a','A',[['choice','a']]]))
 assert.deepEqual(events,[['controlled','checked',false],['controlled','value','a'],['controlled-empty','checked',false],['controlled-empty','value','a']])
 await cleanup();console.warn=warn;console.error=error;assert.deepEqual(warnings,[],'No hydration warnings');await win.happyDOM.close();console.log('LIMITATION: Application opts into controlled parent-state adoption after mount. Not a Ready default, uncontrolled fix, or browser autofill/event-replay guarantee.');console.log('OBSERVATIONS '+JSON.stringify(snapshots));console.log('PASS controlled bootstrap recipe')
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} opt-in controlled bootstrap snapshot adoption`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
 try{
 const {build}=await import('vite');let server,client
 if(framework==='solid'){
 await writeFile(join(folder,'Fixture.tsx'),`import {createSignal,onMount} from 'solid-js';import {Checkbox,Select} from '${root}packages/ready/solid';export default function App({restored={}}={}){return <>{['controlled','controlled-empty'].map(mode=>{const [checked,setChecked]=createSignal(false);const [value,setValue]=createSignal(mode==='controlled'?'a':'');onMount(()=>{if(restored[mode]){setChecked(restored[mode].checked);setValue(restored[mode].value)}});const emit=(type,v)=>globalThis.__readyEvents?.push([mode,type,v]);return <section data-mode={mode}><form><Checkbox name="check" label="Check" checked={checked()} onCheckedChange={v=>{emit('checked',v);setChecked(v)}}/><Select name="choice" label="Choice" value={value()} onValueChange={v=>{emit('value',v);setValue(v)}} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/></form></section>})}</>}`)
 server=`import {renderToString,generateHydrationScript} from 'solid-js/web';import App from './Fixture';export const html=()=>renderToString(()=>App());export const bootstrap=generateHydrationScript();`
 client=`import {hydrate} from 'solid-js/web';import App from './Fixture';export const run=(target,restored)=>hydrate(()=>App({restored}),target);`
 }else{
 await writeFile(join(folder,'Scope.svelte'),`<script>import {onMount} from 'svelte';import {Checkbox,Select} from '${root}packages/ready/svelte';let {mode,restored}=$props();let checked=$state(false),value=$state(mode==='controlled'?'a':'');onMount(()=>{if(restored){checked=restored.checked;value=restored.value}});const emit=(type,v)=>globalThis.__readyEvents?.push([mode,type,v]);</script><section data-mode={mode}><form><Checkbox name="check" label="Check" {checked} onCheckedChange={v=>{emit('checked',v);checked=v}}/><Select name="choice" label="Choice" {value} onValueChange={v=>{emit('value',v);value=v}} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/></form></section>`)
 await writeFile(join(folder,'Fixture.svelte'),`<script>import Scope from './Scope.svelte';let {restored={}}=$props();</script><Scope mode="controlled" restored={restored.controlled}/><Scope mode="controlled-empty" restored={restored['controlled-empty']}/>`)
 server=`import {render} from 'svelte/server';import App from './Fixture.svelte';export const html=()=>render(App).body;`
 client=`import {hydrate,unmount} from 'svelte';import App from './Fixture.svelte';export const run=(target,restored)=>{const app=hydrate(App,{target,props:{restored},recover:false});return ()=>unmount(app)};`
 }
 for(const mode of ['server','client']){
 const entry=join(folder,mode+'.mjs');await writeFile(entry,mode==='server'?server:client)
 const plugin=framework==='solid'?(await import('vite-plugin-solid')).default({ssr:true}):(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],ssr:{noExternal:true},build:{ssr:mode==='server'?entry:false,outDir:join(folder,mode),minify:false,lib:mode==='client'?{entry,formats:['es'],fileName:()=> 'entry.mjs'}:undefined,rollupOptions:{output:{entryFileNames:'entry.mjs',inlineDynamicImports:true}}}})
 }
 const html=join(folder,'ssr.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/entry.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
 const result=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/entry.mjs'),html,framework],{cwd:root,encoding:'utf8',timeout:30000});console.log(framework,result);assert.match(result,/PASS controlled bootstrap recipe/)
 }finally{await rm(folder,{recursive:true,force:true})}
})
