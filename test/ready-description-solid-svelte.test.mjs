import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {join} from 'node:path'
import {runInThisContext} from 'node:vm'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--server'){
 globalThis.__initialHelper=process.argv[5]==='true';globalThis.__description={text:'  Ready 帮助  ',empty:'',blank:'  \t ',absent:undefined}[process.argv[6]]
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 const warnings=[];console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '));
 const {html,bootstrap}=await import(pathToFileURL(process.argv[3]));await writeFile(process.argv[4],html());assert.deepEqual(warnings,[],'SSR warnings');if(bootstrap)await writeFile(process.argv[4]+'.js',bootstrap.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
}else if(process.argv[2]==='--client'){
 globalThis.__initialHelper=process.argv[6]==='true';globalThis.__description={text:'  Ready 帮助  ',empty:'',blank:'  \t ',absent:undefined}[process.argv[7]]
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
 globalThis.window=win;globalThis.document=win.document
 const target=document.createElement('main');document.body.append(target);target.innerHTML=await readFile(process.argv[4],'utf8')
 const scopes=()=>[...target.querySelectorAll('.rd-component')];const nodes=[...target.querySelectorAll('*')];const ids=()=>[...target.querySelectorAll('[id]')].map(n=>n.id);const before=ids();assert.equal(new Set(before).size,before.length)
 const descriptionIds=scopes().map(scope=>scope.querySelector('.rd-description')?.id)
 const check=(text,helper)=>{scopes().forEach((scope,i)=>{const description=scope.querySelector('.rd-description');assert.equal(!!description,!!text);if(text){descriptionIds[i]??=description.id;assert.equal(description.id,descriptionIds[i]);assert.equal(description.textContent,text)}const controls=scope.querySelectorAll('input,select,[data-scope=checkbox][data-part=control],[data-scope=select][data-part=trigger]');assert.equal(controls.length,2);for(const n of controls){const links=(n.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);assert.equal(new Set(links).size,links.length);assert.deepEqual(links.map(id=>{const el=document.getElementById(id);assert.ok(el,'no dangling description '+id);return el.textContent}),[...(helper?['帮助']:[]),...(text?[text]:[]),'错误',...(i===1?['没有选项']:[])])}})}
 check(globalThis.__description?.trim()?globalThis.__description:'',false)
 const warnings=[];const warn=console.warn,error=console.error;console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '))
 if(process.argv[5]==='solid')runInThisContext(await readFile(process.argv[4]+'.js','utf8'))
 const {run}=await import(pathToFileURL(process.argv[3]));const cleanup=run(target)
 const eventually=async fn=>{const deadline=Date.now()+2000;for(;;){try{fn();return}catch(e){if(Date.now()>deadline)throw e;await new Promise(r=>setTimeout(r,10))}}}
 await eventually(()=>check(globalThis.__description?.trim()?globalThis.__description:'',globalThis.__initialHelper));assert.deepEqual(ids(),before);const after=[...target.querySelectorAll('*')];assert.equal(after.length,nodes.length);nodes.forEach((n,i)=>assert.ok(n===after[i],'hydration reuses node '+i))
 for(const [action,text] of [['empty',''],['blank',''],['undefined',''],['restore',' 新描述 ']]){target.querySelector('[data-description='+action+']').click();await eventually(()=>check(text,globalThis.__initialHelper));assert.equal(target.querySelector('output').textContent,'0')}
 target.querySelector('[data-helper]').click();await eventually(()=>check(' 新描述 ',!globalThis.__initialHelper));assert.equal(target.querySelectorAll('option').length,1,'no fake options');await cleanup();console.warn=warn;console.error=error;assert.deepEqual(warnings,[]);await win.happyDOM.close();console.log('PASS SSR hydrate interaction description')
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} owned Checkbox/Select description SSR and hydration`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
 try{
 const {build}=await import('vite');let server,client
 if(framework==='solid'){
 await writeFile(join(folder,'Fixture.tsx'),`import {createSignal} from 'solid-js';import {Field} from '@destyler-ui/solid';import {Checkbox,Select} from '${root}packages/ready/solid';export default function App(){const [description,setDescription]=createSignal(globalThis.__description);const [helper,setHelper]=createSignal(globalThis.__initialHelper);const [calls,setCalls]=createSignal(0);return <form><Field.Root><Checkbox label="Check" description={description()} error="错误" onCheckedChange={()=>setCalls(v=>v+1)}/>{helper() && <Field.HelperText>帮助</Field.HelperText>}</Field.Root><Field.Root><Select label="选择" description={description()} emptyMessage="没有选项" error="错误" options={[]} onValueChange={()=>setCalls(v=>v+1)}/>{helper() && <Field.HelperText>帮助</Field.HelperText>}</Field.Root>{[['empty',''],['blank','  \t '],['undefined',undefined],['restore',' 新描述 ']].map(([key,text])=><button data-description={key} type="button" onClick={()=>setDescription(text)}>{key}</button>)}<button data-helper type="button" onClick={()=>setHelper(v=>!v)}>Helper</button><output>{calls()}</output></form>}`)
 server=`import {renderToString,generateHydrationScript} from 'solid-js/web';import App from './Fixture';export const html=()=>renderToString(()=>App());export const bootstrap=generateHydrationScript();`
 client=`import {hydrate} from 'solid-js/web';import App from './Fixture';export const run=target=>hydrate(()=>App(),target);`
 }else{
 await writeFile(join(folder,'Fixture.svelte'),`<script>import {Field} from '@destyler-ui/svelte/field';import {Checkbox,Select} from '${root}packages/ready/svelte';let description=$state(globalThis.__description),helper=$state(globalThis.__initialHelper),calls=$state(0)</script><form><Field.Root><Checkbox label="Check" {description} error="错误" onCheckedChange={()=>calls++}/>{#if helper}<Field.HelperText>帮助</Field.HelperText>{/if}</Field.Root><Field.Root><Select label="选择" {description} emptyMessage="没有选项" error="错误" options={[]} onValueChange={()=>calls++}/>{#if helper}<Field.HelperText>帮助</Field.HelperText>{/if}</Field.Root>{#each [['empty',''],['blank','  \t '],['undefined',undefined],['restore',' 新描述 ']] as [key,text]}<button data-description={key} type="button" onclick={()=>description=text}>{key}</button>{/each}<button data-helper type="button" onclick={()=>helper=!helper}>Helper</button><output>{calls}</output></form>`)
 server=`import {render} from 'svelte/server';import App from './Fixture.svelte';export const html=()=>render(App).body;`
 client=`import {hydrate,unmount} from 'svelte';import App from './Fixture.svelte';export const run=target=>{const app=hydrate(App,{target,recover:false});return ()=>unmount(app)};`
 }
 for(const mode of ['server','client']){
 const entry=join(folder,mode+'.mjs');await writeFile(entry,mode==='server'?server:client)
 const plugin=framework==='solid'?(await import('vite-plugin-solid')).default({ssr:true}):(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],ssr:{noExternal:true},build:{ssr:mode==='server'?entry:false,outDir:join(folder,mode),minify:false,lib:mode==='client'?{entry,formats:['es'],fileName:()=> 'entry.mjs'}:undefined,rollupOptions:{output:{entryFileNames:'entry.mjs',inlineDynamicImports:true}}}})
 }
 for(const [initialHelper,description] of [['true','text'],['false','text'],['false','empty'],['false','blank'],['false','absent']]){const html=join(folder,'ssr-'+initialHelper+'.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/entry.mjs'),html,initialHelper,description],{cwd:root,encoding:'utf8',timeout:30000})
 const result=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/entry.mjs'),html,framework,initialHelper,description],{cwd:root,encoding:'utf8',timeout:30000});console.log(framework,result);assert.match(result,/PASS SSR hydrate interaction/)}
 }finally{await rm(folder,{recursive:true,force:true})}
})
