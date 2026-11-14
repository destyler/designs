// Locale context vs DOM direction, compiled adapters in simulated DOM.
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
 const target=document.createElement('form');target.dir='rtl';document.body.append(target);const calls=[];const provider=process.argv[4]==='provider';const cleanup=run(target,v=>calls.push(v),provider);await settle();
 const select=target.querySelector('[data-scope=select][data-part=trigger]'), native=target.querySelector('select');
 const dir=provider?'rtl':'ltr';
 for(const scope of ['checkbox','select','dialog']){const nodes=[...target.querySelectorAll(`[data-scope=${scope}][dir]`)];assert.ok(nodes.length);for(const n of nodes)assert.equal(n.dir,dir)}
 select.focus();const expected=provider?['a','b','a']:['c','b','c'];
 for(const [i,key] of ['ArrowLeft','ArrowLeft','ArrowRight'].entries()){select.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await settle();assert.equal(native.value,expected[i]);assert.deepEqual(calls,expected.slice(0,i+1));assert.deepEqual([...new win.FormData(target)],[['choice',expected[i]]])}
 select.click();await settle();assert.equal(select.getAttribute('aria-expanded'),'true');
 const list=target.querySelector('[data-scope=select][data-part=content]');
 for(const [key,value] of [['Home','a'],['ArrowDown','b'],['End','c'],['ArrowUp','b']]){list.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await settle();const id=list.getAttribute('aria-activedescendant');assert.ok(id);assert.equal(document.getElementById(id)?.getAttribute('data-value'),value);assert.deepEqual(calls,expected)}
 list.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await settle();assert.equal(native.value,'b');assert.deepEqual(calls,[...expected,'b']);assert.deepEqual([...new win.FormData(target)],[['choice','b']]);assert.equal(select.getAttribute('aria-expanded'),'false');
 const trigger=target.querySelector('[data-scope=dialog][data-part=trigger]');trigger.click();await settle();const content=target.querySelector('[data-scope=dialog][data-part=content]');assert.equal(content.getAttribute('data-state'),'open');assert.equal(content.dir,dir);content.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await settle();assert.equal(trigger.getAttribute('aria-expanded'),'false');
 await cleanup();await win.happyDOM.close();
}else for(const framework of ['react','vue'])for(const mode of ['ancestor','provider'])test(`Ready ${framework}: RTL ${mode} direction and keyboard contract`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.checkbox-native-'));
 try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {LocaleProvider} from '@destyler-ui/react';import {Select,Checkbox,Dialog} from '${source}';export function run(target,change,provider){const root=createRoot(target);const children=h('div',null,h(Checkbox,{label:'Check'}),h(Select,{label:'Choice',name:'choice',options:[{value:'a',label:'A'},{value:'b',label:'B'},{value:'c',label:'C'}],onValueChange:change}),h(Dialog,{trigger:'Open',title:'Title'}));root.render(provider?h(LocaleProvider,{locale:'ar'},children):children);return()=>root.unmount()}`


   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h} from 'vue';import {LocaleProvider} from '@destyler-ui/vue';import {Select,Checkbox,Dialog} from '${source}';export function run(target,change,provider){const app=createApp({render:()=>{const children=()=>h('div',null,[h(Checkbox,{label:'Check'}),h(Select,{label:'Choice',name:'choice',options:[{value:'a',label:'A'},{value:'b',label:'B'},{value:'c',label:'C'}],onValueChange:change}),h(Dialog,{trigger:'Open',title:'Title'})]);return provider?h(LocaleProvider,{locale:'ar'},children):children()}});app.mount(target);return()=>app.unmount()}`


   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
 console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs'),mode],{cwd:root,encoding:'utf8',timeout:30000}));
 }finally{await rm(folder,{recursive:true,force:true})}
})
