import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {join} from 'node:path'
import {runInThisContext} from 'node:vm'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--server'){
 globalThis.__initialHelper=process.argv[5]==='true'
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 const warnings=[];console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '));
 const {html,bootstrap}=await import(pathToFileURL(process.argv[3]));await writeFile(process.argv[4],html());assert.deepEqual(warnings,[],'SSR warnings');if(bootstrap)await writeFile(process.argv[4]+'.js',bootstrap.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
}else if(process.argv[2]==='--client'){
 globalThis.__initialHelper=process.argv[6]==='true'
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
 globalThis.window=win;globalThis.document=win.document
 const target=document.createElement('main');document.body.append(target);target.innerHTML=await readFile(process.argv[4],'utf8')
 const nodes=[...target.querySelectorAll('*')];const ids=()=>[...target.querySelectorAll('[id]')].map(n=>n.id);const before=ids();const empty=target.querySelector('.rd-empty');assert.equal(!!target.querySelector('[data-scope=field][data-part=helper-text]'),globalThis.__initialHelper,'SSR helper presence');assert.equal(empty.textContent,'没有选项');
 const controls=()=>[target.querySelector('select'),target.querySelector('[data-scope=select][data-part=trigger]')];const refs=n=>(n.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);// Field helper association is client presence-driven; SSR has error + empty only.
 const check=(emptyExpected,helper=true)=>{for(const n of controls()){const links=refs(n);assert.equal(links.includes(empty.id),emptyExpected);assert.deepEqual(links.map(id=>{const el=document.getElementById(id);assert.ok(el);return el.textContent}),[...(helper?['帮助']:[]),'错误',...(emptyExpected?['没有选项']:[])])}};check(true,false)
 const warnings=[];const warn=console.warn,error=console.error;console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '))
 if(process.argv[5]==='solid')runInThisContext(await readFile(process.argv[4]+'.js','utf8'))
 const {run}=await import(pathToFileURL(process.argv[3]));const cleanup=run(target)
 const eventually=async fn=>{const deadline=Date.now()+2000;for(;;){try{fn();return}catch(e){if(Date.now()>deadline)throw e;await new Promise(r=>setTimeout(r,10))}}}
 await eventually(()=>check(true,globalThis.__initialHelper));assert.deepEqual(ids(),before,'IDs');const after=[...target.querySelectorAll('*')];assert.equal(after.length,nodes.length);nodes.forEach((node,i)=>assert.ok(after[i]===node,'node retained '+i))
 // Repeated mount/unmount must preserve own error/empty IDs and never retain absent helper IDs.
 const ownRefs=refs(controls()[0]).filter(id=>document.getElementById(id)?.textContent!=='帮助')
 let shown=globalThis.__initialHelper
 for(let i=0;i<3;i++){target.querySelector('[data-helper]').click();shown=!shown;await eventually(()=>check(true,shown));assert.equal(!!target.querySelector('[data-scope=field][data-part=helper-text]'),shown);for(const node of controls())assert.deepEqual(refs(node).filter(id=>document.getElementById(id)?.textContent!=='帮助'),ownRefs);assert.equal(target.querySelector('output').textContent,'0')}
 if(!shown){target.querySelector('[data-helper]').click();await eventually(()=>check(true,true))}
 target.querySelector('[data-load]').click();await eventually(()=>{assert.ok(target.querySelector('.rd-empty')===null,'empty description removed');check(false,true)});assert.equal(target.querySelector('output').textContent,'0');assert.equal(target.querySelector('select').options.length,2)
 target.querySelector('[data-helper]').click();await eventually(()=>check(false,false));await cleanup();assert.equal(target.children.length,0);console.warn=warn;console.error=error;assert.deepEqual(warnings,[]);await win.happyDOM.close();console.log('PASS SSR hydrate interaction helper initially '+globalThis.__initialHelper)
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} localized empty description SSR and hydration`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
 try{
 const {build}=await import('vite');let server,client
 if(framework==='solid'){
 await writeFile(join(folder,'Fixture.tsx'),`import {createSignal} from 'solid-js';import {Field} from '@destyler-ui/solid';import {Select} from '${root}packages/ready/solid';export default function App(){const [options,setOptions]=createSignal([]);const [calls,setCalls]=createSignal(0);const [helper,setHelper]=createSignal(globalThis.__initialHelper);return <form><Field.Root><Select label="选择" emptyMessage="没有选项" error="错误" options={options()} onValueChange={()=>setCalls(v=>v+1)}/>{helper() && <Field.HelperText>帮助</Field.HelperText>}</Field.Root><button data-helper type="button" onClick={()=>setHelper(v=>!v)}>Toggle helper</button><button data-load type="button" onClick={()=>setOptions([{value:'a',label:'A'}])}>Load</button><output>{calls()}</output></form>}`)
 server=`import {renderToString,generateHydrationScript} from 'solid-js/web';import App from './Fixture';export const html=()=>renderToString(()=>App());export const bootstrap=generateHydrationScript();`
 client=`import {hydrate} from 'solid-js/web';import App from './Fixture';export const run=target=>hydrate(()=>App(),target);`
 }else{
 await writeFile(join(folder,'Fixture.svelte'),`<script>import {Field} from '@destyler-ui/svelte/field';import {Select} from '${root}packages/ready/svelte';let options=$state([]),calls=$state(0),helper=$state(globalThis.__initialHelper)</script><form><Field.Root><Select label="选择" emptyMessage="没有选项" error="错误" {options} onValueChange={()=>calls++}/>{#if helper}<Field.HelperText>帮助</Field.HelperText>{/if}</Field.Root><button data-helper type="button" onclick={()=>helper=!helper}>Toggle helper</button><button data-load type="button" onclick={()=>options=[{value:'a',label:'A'}]}>Load</button><output>{calls}</output></form>`)
 server=`import {render} from 'svelte/server';import App from './Fixture.svelte';export const html=()=>render(App).body;`
 client=`import {hydrate,unmount} from 'svelte';import App from './Fixture.svelte';export const run=target=>{const app=hydrate(App,{target,recover:false});return ()=>unmount(app)};`
 }
 for(const mode of ['server','client']){
 const entry=join(folder,mode+'.mjs');await writeFile(entry,mode==='server'?server:client)
 const plugin=framework==='solid'?(await import('vite-plugin-solid')).default({ssr:true}):(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],ssr:{noExternal:true},build:{ssr:mode==='server'?entry:false,outDir:join(folder,mode),minify:false,lib:mode==='client'?{entry,formats:['es'],fileName:()=> 'entry.mjs'}:undefined,rollupOptions:{output:{entryFileNames:'entry.mjs',inlineDynamicImports:true}}}})
 }
 for(const initialHelper of ['true','false']){const html=join(folder,'ssr-'+initialHelper+'.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/entry.mjs'),html,initialHelper],{cwd:root,encoding:'utf8',timeout:30000})
 const result=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/entry.mjs'),html,framework,initialHelper],{cwd:root,encoding:'utf8',timeout:30000});console.log(framework,result);assert.match(result,/PASS SSR hydrate interaction/)}
 }finally{await rm(folder,{recursive:true,force:true})}
})
