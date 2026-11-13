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
 document.body.innerHTML=await readFile(process.argv[4],'utf8')
 const scopes=()=>[...document.querySelectorAll('[data-rd-theme]')]
 const ids=()=>[...document.querySelectorAll('[id]')].map(e=>e.id)
 const before=ids();assert.equal(new Set(before).size,before.length,'SSR IDs unique across themes');assert.equal(scopes().length,4)
 const snapshot=()=>scopes().map(s=>({checked:s.querySelector('input').checked,value:s.querySelector('select').value,data:s.querySelector('select').disabled?null:[...new win.FormData(s.querySelector('form'))]}))
 const expected=[{checked:true,value:'a',data:[['check','on'],['choice','a']]},{checked:false,value:'b',data:[['choice','b']]},{checked:false,value:'',data:[['choice','']]},{checked:true,value:'b',data:null}]
 // Happy DOM incorrectly includes even a bare disabled select in FormData.
 // Assert native disabled semantics here; do not patch components around that shim bug.
 assert.equal(scopes()[3].querySelector('select').hasAttribute('disabled'),true)
 assert.equal(scopes()[3].querySelector('input').disabled,true)
 assert.deepEqual(snapshot(),expected,'SSR controlled inputs and enabled form entries')
 const assertLinks=()=>{for(const scope of scopes())for(const el of scope.querySelectorAll('[aria-labelledby],[aria-describedby]'))for(const attr of ['aria-labelledby','aria-describedby'])for(const id of (el.getAttribute(attr)||'').split(/\s+/).filter(Boolean))assert.ok([...scope.querySelectorAll('[id]')].some(node=>node.id===id),`${attr} resolves inside own theme: ${id}`)}
 assertLinks()
 const assertLabels=()=>scopes().forEach((s,i)=>assert.equal(s.querySelector('[data-part=value-text]').textContent,expected[i].value?expected[i].value.toUpperCase():'Choose an option','Visible selection matches controlled value'))
 assertLabels()
 const retainedSelector='form,input,select,[data-scope=dialog][data-part=content]'
 const nodes=scopes().map(s=>[...s.querySelectorAll(retainedSelector)])
 const warnings=[];const warn=console.warn,error=console.error;console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '))
 if(process.argv[5]==='solid')runInThisContext(await readFile(process.argv[4]+'.js','utf8'))
 const {run}=await import(pathToFileURL(process.argv[3]));const cleanup=run(document.body)
 const eventually=async fn=>{const deadline=Date.now()+2000;for(;;){try{fn();return}catch(e){if(Date.now()>deadline)throw e;await new Promise(r=>setTimeout(r,10))}}}
 await eventually(()=>{assert.deepEqual(snapshot(),expected)})
 assert.deepEqual(ids(),before,'Hydration preserves server IDs');scopes().forEach((s,i)=>{const current=[...s.querySelectorAll(retainedSelector)];assert.equal(current.length,nodes[i].length);current.forEach((node,j)=>assert.equal(node,nodes[i][j],'Hydrates existing form/input/select/dialog content'))})
 assertLinks();assertLabels();assert.deepEqual(snapshot(),expected,'Hydration preserves form submission')
 for(const [index,s] of scopes().entries()){
 assert.equal(s.querySelectorAll('select').length,1,'One native Select per component')
 if(index===3){assert.equal(s.querySelector('select').disabled,true);assert.equal(s.querySelector('input').disabled,true);continue}
 const nextChecked=!expected[index].checked;const nextValue=expected[index].value==='b'?'a':'b'
 s.querySelector('[data-scope=checkbox][data-part=control]').click();await eventually(()=>assert.equal(s.querySelector('input').checked,nextChecked))
 s.querySelector('[data-scope=select][data-part=trigger]').click();await eventually(()=>assert.ok(s.querySelector('[data-scope=select][data-part=item]')))
 ;[...s.querySelectorAll('[data-scope=select][data-part=item]')].find(e=>e.textContent.includes(nextValue.toUpperCase())).click();await eventually(()=>assert.equal(s.querySelector('select').value,nextValue))
 s.querySelector('[data-scope=dialog][data-part=trigger]').click();await eventually(()=>assert.equal(s.querySelector('[data-scope=dialog][data-part=content]').getAttribute('data-state'),'open'))
 assertLinks();assert.deepEqual([...new win.FormData(s.querySelector('form'))],[...(nextChecked?[['check','on']]:[]),['choice',nextValue]],'Hydrated form submits controlled interaction values')
 s.querySelector('[data-scope=dialog][data-part=close-trigger]').click();await eventually(()=>assert.notEqual(s.querySelector('[data-scope=dialog][data-part=content]')?.getAttribute('data-state'),'open'))
 expected[index]={checked:nextChecked,value:nextValue,data:[...(nextChecked?[['check','on']]:[]),['choice',nextValue]]}
 assert.deepEqual(snapshot(),expected,'Interaction does not change neighboring scopes');assertLabels()
 }
 console.warn=warn;console.error=error;assert.deepEqual(warnings,[],'No hydration/runtime warnings');await cleanup();await win.happyDOM.close();console.log('PASS SSR hydrate interaction')
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} real server render and client hydration`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
 try{
 const {build}=await import('vite');let server,client
 if(framework==='solid'){
 await writeFile(join(folder,'Fixture.tsx'),`import {createSignal} from 'solid-js';import {Checkbox,Select,Dialog} from '${root}packages/ready/solid';export default function App(){return <>{['default','midnight','default','midnight'].map((theme,index)=>{const [checked,setChecked]=createSignal(index===0||index===3);const [value,setValue]=createSignal(['a','b','','b'][index]);const [open,setOpen]=createSignal(false);return <section data-rd-theme={theme}><form><Checkbox name="check" label="Check" disabled={index===3} checked={checked()} onCheckedChange={setChecked}/><Select name="choice" label="Choice" disabled={index===3} value={value()} onValueChange={setValue} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/><Dialog trigger="Open" title="Title" description="Description" open={open()} onOpenChange={setOpen}>Body</Dialog></form></section>})}</>}`)
 server=`import {renderToString,generateHydrationScript} from 'solid-js/web';import App from './Fixture';export const html=()=>renderToString(()=>App());export const bootstrap=generateHydrationScript();`
 client=`import {hydrate} from 'solid-js/web';import App from './Fixture';export const run=target=>hydrate(()=>App(),target);`
 }else{
 await writeFile(join(folder,'Scope.svelte'),`<script>import {Checkbox,Select,Dialog} from '${root}packages/ready/svelte';let {theme,initialChecked,initialValue,disabled=false}=$props();let checked=$state(initialChecked),value=$state(initialValue),open=$state(false);</script><section data-rd-theme={theme}><form><Checkbox name="check" label="Check" {disabled} {checked} onCheckedChange={v=>checked=v}/><Select name="choice" label="Choice" {disabled} {value} onValueChange={v=>value=v} options={[{label:'A',value:'a'},{label:'B',value:'b'}]}/><Dialog trigger="Open" title="Title" description="Description" {open} onOpenChange={v=>open=v}>Body</Dialog></form></section>`)
 await writeFile(join(folder,'Fixture.svelte'),`<script>import Scope from './Scope.svelte'</script><Scope theme="default" initialChecked={true} initialValue="a"/><Scope theme="midnight" initialChecked={false} initialValue="b"/><Scope theme="default" initialChecked={false} initialValue=""/><Scope theme="midnight" initialChecked={true} initialValue="b" disabled={true}/>`)
 server=`import {render} from 'svelte/server';import App from './Fixture.svelte';export const html=()=>render(App).body;`
 client=`import {hydrate,unmount} from 'svelte';import App from './Fixture.svelte';export const run=target=>{const app=hydrate(App,{target,recover:false});return ()=>unmount(app)};`
 }
 for(const mode of ['server','client']){
 const entry=join(folder,mode+'.mjs');await writeFile(entry,mode==='server'?server:client)
 const plugin=framework==='solid'?(await import('vite-plugin-solid')).default({ssr:true}):(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],ssr:{noExternal:true},build:{ssr:mode==='server'?entry:false,outDir:join(folder,mode),minify:false,lib:mode==='client'?{entry,formats:['es'],fileName:()=> 'entry.mjs'}:undefined,rollupOptions:{output:{entryFileNames:'entry.mjs',inlineDynamicImports:true}}}})
 }
 const html=join(folder,'ssr.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/entry.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
 const result=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/entry.mjs'),html,framework],{cwd:root,encoding:'utf8',timeout:30000});console.log(framework,result);assert.match(result,/PASS SSR hydrate interaction/)
 }finally{await rm(folder,{recursive:true,force:true})}
})
