// The raw initial requested key is the reset baseline, even before async options arrive.
// Compiled components in simulated DOM; not real-browser autofill/restoration coverage.
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

 const {run}=await import(pathToFileURL(process.argv[3]));const settle=()=>new Promise(r=>setTimeout(r,150));
 for(const mode of ['accept','refuse'])for(const cancelled of [false,true]){
  const form=document.createElement('form');document.body.append(form);const callbacks=[];
  const app=run(form,mode,[],v=>callbacks.push(v));await settle();app.options([{value:'a',label:'A'},{value:'b',label:'B'}]);await settle();
  if(cancelled)form.addEventListener('reset',e=>e.preventDefault(),{once:true});
  const check=value=>{assert.equal(form.querySelector('select').value,value);assert.equal(form.querySelector('[data-part=value-text]').textContent,value?value.toUpperCase():'Choose an option');assert.deepEqual([...new win.FormData(form)],[['plan',value]])};
  check('b');form.reset();await settle();check('b');assert.deepEqual(callbacks,[],'Unchanged requested baseline resets without callback');
  app.value('a');await settle();check('a');
  if(cancelled)form.addEventListener('reset',e=>e.preventDefault(),{once:true});
  form.reset();await settle();check(cancelled||mode==='refuse'?'a':'b');assert.deepEqual(callbacks,cancelled?[]:['b']);
  callbacks.length=0;app.value('a');app.options([{value:'a',label:'A'}]);await settle();check('a');
  if(cancelled)form.addEventListener('reset',e=>e.preventDefault(),{once:true});
  form.reset();await settle();check(cancelled||mode==='refuse'?'a':'');assert.deepEqual(callbacks,cancelled?[]:['b'],'Missing reset baseline remains a requested key');
  app.options([{value:'a',label:'A'},{value:'b',label:'B'}]);await settle();check(cancelled||mode==='refuse'?'a':'b');assert.deepEqual(callbacks,cancelled?[]:['b'],'Arrival must not fabricate callback');
  await app.cleanup();form.remove();await settle();
 }
 await win.happyDOM.close();
}else for(const framework of ['react','vue'])test(`Ready ${framework}: pending initial key remains reset baseline`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.reset-audit-'));
 try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Select} from '${source}';export function run(target,mode,initial,change){let api={};function App(){const [options,setOptions]=useState([]),[value,setValue]=useState('b');api.options=setOptions;api.value=setValue;return h(Select,{name:'plan',label:'Plan',options,value:mode==='uncontrolled'?undefined:value,onValueChange:v=>{change(v);if(mode==='accept')setValue(v)}})}const root=createRoot(target);root.render(h(App));return{options:v=>api.options(v),value:v=>api.value(v),cleanup:()=>root.unmount()}}`
   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h,ref} from 'vue';import {Select} from '${source}';export function run(target,mode,initial,change){const options=ref([]),value=ref('b');const app=createApp({render:()=>h(Select,{name:'plan',label:'Plan',options:options.value,value:mode==='uncontrolled'?undefined:value.value,'onUpdate:value':v=>{change(v);if(mode==='accept')value.value=v}})});app.mount(target);return{options:v=>options.value=v,value:v=>value.value=v,cleanup:()=>app.unmount()}}`
   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
 console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}));
 }finally{await rm(folder,{recursive:true,force:true})}
})
