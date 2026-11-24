// Opt-in investigation: node --test test/ready-prehydration-solid-svelte.mjs
// Not part of default *.test.mjs regression suite; observed gaps are not desired behavior.
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
 const server=snapshot('server');assert.deepEqual(server.map(s=>[s.checked,s.value]),[[true,'a'],[false,'']])
 for(const s of scopes()){s.querySelector('input').checked=!s.querySelector('input').checked;s.querySelector('select').value='b'}
 assert.deepEqual(snapshot('native-edited-before-hydration').map(s=>[s.checked,s.value]),[[false,'b'],[true,'b']])
 const warnings=[];const warn=console.warn,error=console.error;console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '))
 if(process.argv[5]==='solid')runInThisContext(await readFile(process.argv[4]+'.js','utf8'))
 const {run}=await import(pathToFileURL(process.argv[3]));const cleanup=run(target)
 snapshot('hydrate-immediate')
 // Observe a stable result, not a claimed browser autofill timing contract.
 const waitForStable=async()=>{let last='',stableSince=Date.now();const deadline=Date.now()+2000
 while(Date.now()<deadline){await new Promise(r=>setTimeout(r,20));const current=JSON.stringify(scopes().map(s=>({checked:s.querySelector('input').checked,value:s.querySelector('select').value,label:s.querySelector('[data-part=value-text]').textContent,checkbox:s.querySelector('[data-scope=checkbox][data-part=control]').dataset.state,events})));if(current!==last){last=current;stableSince=Date.now()}else if(Date.now()-stableSince>=200)return}
 throw new Error('Observation did not settle within two seconds')}
 await waitForStable()
 snapshot('hydrate-settled')
 for(const s of scopes()){
 s.querySelector('[data-scope=checkbox][data-part=control]').click();await waitForStable();snapshot(s.dataset.mode+'-first-checkbox-click')
 s.querySelector('[data-scope=select][data-part=trigger]').click();await waitForStable();[...s.querySelectorAll('[data-part=item]')].find(e=>e.querySelector('[data-part=item-text]')?.textContent==='B').click();await waitForStable();snapshot(s.dataset.mode+'-first-select-choice-b')
 }
 assert.deepEqual(snapshots.at(-1).state.map(s=>s.value),['b','b'],'Post-hydration explicit selection works in both modes')
 assert.deepEqual(events.filter(e=>e[1]==='value'),[['controlled','value','b'],['uncontrolled','value','b']])
 // Intermediate snapshots intentionally characterize existing behavior rather than
 // declaring silent overwrite or preserved-but-stale native state a desired API contract.
 await cleanup();console.warn=warn;console.error=error;assert.deepEqual(warnings,[],'No hydration warnings');await win.happyDOM.close();console.log('LIMITATION: Native edits before hydration may be silently overwritten, or retained only in the native Checkbox while visual/machine state is stale. This investigation does not endorse that behavior or prove browser autofill/event replay support.');console.log('OBSERVATIONS '+JSON.stringify(snapshots));console.log('PASS prehydration observation')
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} native edits before hydration (observational)`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
 try{
 const {build}=await import('vite');let server,client
 if(framework==='solid'){
 await writeFile(join(folder,'Fixture.tsx'),`import {createSignal} from 'solid-js';import {Checkbox,Select} from '${root}packages/ready/solid';export default function App(){return <>{['controlled','uncontrolled'].map(mode=>{const [checked,setChecked]=createSignal(true);const [value,setValue]=createSignal('a');const emit=(type,v)=>globalThis.__readyEvents?.push([mode,type,v]);return <section data-mode={mode}><form><Checkbox name="check" label="Check" checked={mode==='controlled'?checked():undefined} onCheckedChange={v=>{emit('checked',v);setChecked(v)}}/><Select name="choice" label="Choice" value={mode==='controlled'?value():undefined} onValueChange={v=>{emit('value',v);setValue(v)}} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/></form></section>})}</>}`)
 server=`import {renderToString,generateHydrationScript} from 'solid-js/web';import App from './Fixture';export const html=()=>renderToString(()=>App());export const bootstrap=generateHydrationScript();`
 client=`import {hydrate} from 'solid-js/web';import App from './Fixture';export const run=target=>hydrate(()=>App(),target);`
 }else{
 await writeFile(join(folder,'Scope.svelte'),`<script>import {Checkbox,Select} from '${root}packages/ready/svelte';let {mode}=$props();let checked=$state(true),value=$state('a');const emit=(type,v)=>globalThis.__readyEvents?.push([mode,type,v]);</script><section data-mode={mode}><form><Checkbox name="check" label="Check" checked={mode==='controlled'?checked:undefined} onCheckedChange={v=>{emit('checked',v);checked=v}}/><Select name="choice" label="Choice" value={mode==='controlled'?value:undefined} onValueChange={v=>{emit('value',v);value=v}} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/></form></section>`)
 await writeFile(join(folder,'Fixture.svelte'),`<script>import Scope from './Scope.svelte'</script><Scope mode="controlled"/><Scope mode="uncontrolled"/>`)
 server=`import {render} from 'svelte/server';import App from './Fixture.svelte';export const html=()=>render(App).body;`
 client=`import {hydrate,unmount} from 'svelte';import App from './Fixture.svelte';export const run=target=>{const app=hydrate(App,{target,recover:false});return ()=>unmount(app)};`
 }
 for(const mode of ['server','client']){
 const entry=join(folder,mode+'.mjs');await writeFile(entry,mode==='server'?server:client)
 const plugin=framework==='solid'?(await import('vite-plugin-solid')).default({ssr:true}):(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],ssr:{noExternal:true},build:{ssr:mode==='server'?entry:false,outDir:join(folder,mode),minify:false,lib:mode==='client'?{entry,formats:['es'],fileName:()=> 'entry.mjs'}:undefined,rollupOptions:{output:{entryFileNames:'entry.mjs',inlineDynamicImports:true}}}})
 }
 const html=join(folder,'ssr.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/entry.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
 const result=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/entry.mjs'),html,framework],{cwd:root,encoding:'utf8',timeout:30000});console.log(framework,result);assert.match(result,/PASS prehydration observation/)
 }finally{await rm(folder,{recursive:true,force:true})}
})
