// Real adapters in simulated DOM: keyboard state, not layout/scroll or browser acceptance.
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
 const {run}=await import(pathToFileURL(process.argv[3]));const target=document.createElement('form');document.body.append(target);const calls=[];const cleanup=run(target,v=>calls.push(v));
 const eventually=async fn=>{const deadline=Date.now()+2000;for(;;){try{fn();return}catch(e){if(Date.now()>deadline)throw e;await new Promise(r=>setTimeout(r,10))}}}
 const trigger=()=>target.querySelector('[data-part=trigger]');const content=()=>target.querySelector('[data-part=content]');const native=()=>target.querySelector('select');
 await eventually(()=>assert.equal(native()?.options.length,81));assert.equal(target.querySelectorAll('[data-part=item]').length,80);trigger().click();await eventually(()=>assert.equal(trigger().getAttribute('aria-expanded'),'true'));
 const key=pressed=>content().dispatchEvent(new win.KeyboardEvent('keydown',{key:pressed,bubbles:true,cancelable:true}));
 const highlighted=index=>{const id=content().getAttribute('aria-activedescendant');assert.ok(id,'active descendant present');const node=document.getElementById(id);assert.ok(node&&content().contains(node),'active descendant resolves within list');assert.equal(node.getAttribute('data-value'),String(index));assert.equal(node.hasAttribute('data-disabled'),false);assert.ok(node.hasAttribute('data-highlighted'));assert.equal(target.querySelectorAll('[data-part=item][data-highlighted]').length,1)};
 // Synthetic keys verify handlers and state, not browser layout or default activation.
 for(const [pressed,index] of [['Home',1],['ArrowDown',2],['End',78],['ArrowUp',77],['End',78]]){key(pressed);await eventually(()=>highlighted(index));assert.deepEqual(calls,[]);assert.equal(native().value,'');assert.deepEqual([...new win.FormData(target)],[['choice','']])}
 key('Enter');await eventually(()=>{assert.equal(native().value,'78');assert.equal(target.querySelector('[data-part=value-text]').textContent,'Option 78');assert.equal(trigger().getAttribute('aria-expanded'),'false');assert.deepEqual(calls,['78']);assert.deepEqual([...new win.FormData(target)],[['choice','78']])});
 trigger().click();await eventually(()=>assert.equal(trigger().getAttribute('aria-expanded'),'true'));key('Home');await eventually(()=>highlighted(1));key('Enter');await eventually(()=>{assert.equal(native().value,'1');assert.equal(target.querySelector('[data-part=value-text]').textContent,'Option 1');assert.deepEqual(calls,['78','1']);assert.deepEqual([...new win.FormData(target)],[['choice','1']])});await cleanup();await win.happyDOM.close();console.log('PASS long list keyboard state; no layout/scroll claim')
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} long Select list keyboard state`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-long-list-'));try{
 const {build}=await import('vite');let plugin,code
 const options="Array.from({length:80},(_,i)=>({value:String(i),label:'Option '+i,disabled:i===0||i===79}))"
 if(framework==='solid'){plugin=(await import('vite-plugin-solid')).default();code=`import {render} from 'solid-js/web';import {createComponent,createSignal} from 'solid-js';import {Select} from '${root}packages/ready/solid';export function run(target,change){const [value,setValue]=createSignal('');return render(()=>createComponent(Select,{label:'Long list',name:'choice',options:${options},get value(){return value()},onValueChange:v=>{change(v);setValue(v)}}),target)}`
 }else{plugin=(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false});await writeFile(join(folder,'Fixture.svelte'),`<script>import {Select} from '${root}packages/ready/svelte';let {change}=$props();let value=$state('');const options=${options}</script><Select label="Long list" name="choice" {value} {options} onValueChange={v=>{change(v);value=v}}/>`);code=`import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,change){const app=mount(Fixture,{target,props:{change}});return()=>unmount(app)}`}
 const entry=join(folder,'entry.mjs');await writeFile(entry,code);await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}});console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}))
 }finally{await rm(folder,{recursive:true,force:true})}
})
