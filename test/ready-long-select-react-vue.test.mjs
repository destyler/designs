// Compiled long-list keyboard handlers in simulated DOM, without layout mocks.
// No real scrolling, accessibility-tree or browser keyboard claims.
import assert from 'node:assert/strict'
import test from 'node:test'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--worker'){
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)

 const settle=()=>new Promise(r=>setTimeout(r,120));const {run}=await import(pathToFileURL(process.argv[3]));
 const target=document.createElement('form');document.body.append(target);const callbacks=[];const cleanup=run(target,v=>callbacks.push(v));await settle();
 const trigger=target.querySelector('[data-part=trigger]'),native=target.querySelector('select');trigger.focus();trigger.click();await settle();assert.equal(trigger.getAttribute('aria-expanded'),'true');assert.equal(target.querySelectorAll('[role=option]').length,80);
 const press=async key=>{document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await settle()};
 const highlight=value=>{const item=target.querySelector('[data-highlighted]');assert.ok(item,`Expected highlight ${value}`);assert.equal(item.getAttribute('data-value'),value);assert.notEqual(item.getAttribute('aria-disabled'),'true');const owners=[...target.querySelectorAll('[aria-activedescendant]')];assert.ok(owners.some(n=>n.getAttribute('aria-activedescendant')===item.id));for(const node of owners){const id=node.getAttribute('aria-activedescendant');assert.ok(!id||document.getElementById(id))}};
 for(const [key,value] of [['Home','item-1'],['ArrowDown','item-2'],['End','item-78'],['ArrowUp','item-77'],['Home','item-1']]){await press(key);highlight(value);assert.deepEqual(callbacks,[]);assert.equal(native.value,'')}
 await press('Enter');assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.equal(native.value,'item-1');assert.equal(target.querySelector('[data-part=value-text]').textContent,'Option 1');assert.deepEqual([...new win.FormData(target)],[['choice','item-1']]);assert.deepEqual(callbacks,['item-1']);
 trigger.focus();trigger.click();await settle();await press('End');highlight('item-78');await press('Enter');assert.equal(native.value,'item-78');assert.equal(target.querySelector('[data-part=value-text]').textContent,'Option 78');assert.deepEqual([...new win.FormData(target)],[['choice','item-78']]);assert.deepEqual(callbacks,['item-1','item-78']);
 await cleanup();await win.happyDOM.close();
}else for(const framework of ['react','vue'])test(`Ready ${framework}: 80-option keyboard selection skips disabled boundaries`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.checkbox-native-'));
 try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {Select} from '${source}';export function run(target,change){const options=Array.from({length:80},(_,i)=>({value:'item-'+i,label:'Option '+i,disabled:i===0||i===79}));const root=createRoot(target);root.render(h(Select,{label:'Choice',name:'choice',options,onValueChange:change}));return()=>root.unmount()}`

   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h} from 'vue';import {Select} from '${source}';export function run(target,change){const options=Array.from({length:80},(_,i)=>({value:'item-'+i,label:'Option '+i,disabled:i===0||i===79}));const app=createApp({render:()=>h(Select,{label:'Choice',name:'choice',options,onValueChange:change})});app.mount(target);return()=>app.unmount()}`

   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
 console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}));
 }finally{await rm(folder,{recursive:true,force:true})}
})
