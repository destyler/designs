// Timing observation only: callback, click return, microtask and settled snapshots.
// Compiled components in simulated DOM; native preventDefault is a comparison, not controlled state.
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

 const settle=()=>new Promise(r=>setTimeout(r,100));
 const snapshot=(form,stage,extra={})=>({stage,...extra,checked:form.querySelector('input').checked,visual:form.querySelector('[data-part=control]')?.getAttribute('data-state')??null,data:[...new win.FormData(form)]});
 for(const initial of [false,true])for(const cancelled of [false,true]){
  const form=document.createElement('form');form.innerHTML='<input type="checkbox" name="consent">';document.body.append(form);const input=form.querySelector('input');input.checked=initial;const states=[];
  for(const event of ['click','input','change'])input.addEventListener(event,e=>{states.push(snapshot(form,event));if(event==='click'&&cancelled)e.preventDefault()});
  input.click();states.push(snapshot(form,'click-return'));await Promise.resolve();states.push(snapshot(form,'microtask'));await settle();states.push(snapshot(form,'settled'));
  console.log(JSON.stringify({kind:'native',initial,cancelled,states}));form.remove();
 }
 const {run}=await import(pathToFileURL(process.argv[3]));
 for(const mode of ['accept','refuse'])for(const initial of [false,true]){
  const form=document.createElement('form');document.body.append(form);const states=[];const app=run(form,mode,initial,(proposal,parentvalue)=>states.push(snapshot(form,'callback',{proposal,parentvalue})));await settle();const input=form.querySelector('input');
  states.push(snapshot(form,'before',{parentvalue:app.parent()}));input.click();states.push(snapshot(form,'click-return',{parentvalue:app.parent()}));await Promise.resolve();states.push(snapshot(form,'microtask',{parentvalue:app.parent()}));await settle();states.push(snapshot(form,'settled',{parentvalue:app.parent()}));
  console.log(JSON.stringify({kind:'ready',mode,initial,states}));await app.cleanup();form.remove();
 }
 await win.happyDOM.close();
}else for(const framework of ['react','vue'])test(`Ready ${framework}: Checkbox synchronous callback observation`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.checkbox-native-'));
 try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Checkbox} from '${source}';export function run(target,mode,initial,change){let api={};function App(){const [checked,set]=useState(initial),[disabled,disable]=useState(false);api.value=set;api.disabled=disable;api.parent=()=>checked;return h(Checkbox,{label:'Consent',name:'consent',required:true,disabled,checked:mode==='uncontrolled'?undefined:checked,onCheckedChange:v=>{change(v,checked);if(mode==='accept')set(v)}})}const root=createRoot(target);root.render(h(App));return{parent:()=>api.parent(),value:v=>api.value(v),disabled:v=>api.disabled(v),cleanup:()=>root.unmount()}}`

   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h,ref} from 'vue';import {Checkbox} from '${source}';export function run(target,mode,initial,change){const checked=ref(initial),disabled=ref(false);const app=createApp({render:()=>h(Checkbox,{label:'Consent',name:'consent',required:true,disabled:disabled.value,checked:mode==='uncontrolled'?undefined:checked.value,onCheckedChange:v=>{change(v,checked.value);if(mode==='accept')checked.value=v}})});app.mount(target);return{parent:()=>checked.value,value:v=>checked.value=v,disabled:v=>disabled.value=v,cleanup:()=>app.unmount()}}`

   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
 console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}));
 }finally{await rm(folder,{recursive:true,force:true})}
})
