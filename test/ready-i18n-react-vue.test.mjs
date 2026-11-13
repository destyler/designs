// Compiled translation and description contracts in simulated DOM.
// No accessibility-tree, live-announcement or browser claims.
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

 const settle=()=>new Promise(r=>setTimeout(r,100));const {run}=await import(pathToFileURL(process.argv[3]));
 for(const kind of ['select','dialog']){
  const host=document.createElement('form');document.body.append(host);const callbacks=[],errors=[];const app=run(host,kind,v=>callbacks.push(v),e=>errors.push(e));await settle();
  const trigger=host.querySelector('[data-part=trigger]');
  if(kind==='select'){
   const native=host.querySelector('select'),label=host.querySelector('[data-part=label]');const labelId=label.id;
   let emptyId;const checkEmpty=text=>{const empty=host.querySelector('.rd-empty');assert.ok(empty);assert.equal(empty.textContent,text);assert.equal(empty.getAttribute('role'),null);assert.equal(empty.getAttribute('aria-live'),null);if(emptyId)assert.equal(empty.id,emptyId);emptyId=empty.id;assert.equal(empty.closest('[role=listbox]'),null);const helper=host.querySelector('[data-part=helper-text]'),error=host.querySelector('.rd-error');for(const node of [trigger,native]){const ids=node.getAttribute('aria-describedby').split(/\s+/);assert.deepEqual(new Set(ids),new Set([helper.id,error.id,empty.id]));assert.equal(node.getAttribute('aria-labelledby'),labelId)}assert.equal(host.querySelectorAll('[role=option]').length,0);assert.equal(native.options.length,1);assert.equal(native.value,'')};
   checkEmpty('No options available');trigger.click();await settle();assert.equal(trigger.getAttribute('aria-expanded'),'true');checkEmpty('No options available');
   app.update({placeholder:'请选择',emptyMessage:'  暂无选项  '});await settle();assert.equal(host.querySelector('[data-part=value-text]').textContent,'请选择');checkEmpty('  暂无选项  ');
   app.update({placeholder:''});await settle();assert.equal(host.querySelector('[data-part=value-text]').textContent,'');
   app.update({options:[{value:'a',label:'甲'}]});await settle();assert.equal(host.querySelector('.rd-empty'),null);assert.equal(host.querySelectorAll('[role=option]').length,1);for(const node of [trigger,native])assert.ok(!node.getAttribute('aria-describedby').split(/\s+/).includes(emptyId));assert.equal(native.value,'');
   app.update({options:[]});await settle();checkEmpty('  暂无选项  ');assert.deepEqual(callbacks,[]);
  }else{
   assert.equal(host.querySelector('[data-part=close-trigger]').textContent,'Close');trigger.click();await settle();assert.equal(trigger.getAttribute('aria-expanded'),'true');
   app.update({closeLabel:'  关闭  '});await settle();const close=host.querySelector('[data-part=close-trigger]');assert.equal(close.textContent,'  关闭  ');close.click();await settle();assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.deepEqual(callbacks,[true,false]);
  }
  const ids=[...host.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);assert.deepEqual(errors,[]);await app.cleanup();host.remove();
 }
 for(const [kind,prop,component] of [['select','emptyMessage','Select'],['dialog','closeLabel','Dialog']])for(const value of ['', ' \t '])for(const dynamic of [false,true]){
  const host=document.createElement('div');document.body.append(host);const errors=[];let app;try{app=run(host,kind,()=>{},e=>errors.push(e),dynamic?{}:{[prop]:value})}catch(e){errors.push(e)}await settle();if(dynamic){app.update({[prop]:value});await settle()}assert.ok(errors.some(e=>e.message===`Ready ${component}: ${prop} must contain non-whitespace text.`));if(app)await app.cleanup();host.remove();
 }
 await win.happyDOM.close();
}else for(const framework of ['react','vue'])test(`Ready ${framework}: translated placeholder, empty description and close button contracts`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.checkbox-native-'));
 try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Field} from '@destyler-ui/react';import {Select,Dialog} from '${source}';export function run(target,kind,change,error,initial={}){let update;function App(){const [props,set]=useState(initial);update=v=>set(p=>({...p,...v}));return kind==='select'?h(Field.Root,null,h(Field.HelperText,null,'Helper'),h(Select,{label:'方案',name:'plan',options:[],error:'Invalid',...props,onValueChange:change})):h(Dialog,{trigger:'打开',title:'详情',description:'',...props,onOpenChange:change})}const root=createRoot(target,{onUncaughtError:error});root.render(h(App));return{update:v=>update(v),cleanup:()=>root.unmount()}}`

   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h,ref} from 'vue';import {Field} from '@destyler-ui/vue';import {Select,Dialog} from '${source}';export function run(target,kind,change,error,initial={}){const props=ref(initial);const app=createApp({render:()=>kind==='select'?h(Field.Root,null,{default:()=>[h(Field.HelperText,null,{default:()=> 'Helper'}),h(Select,{label:'方案',name:'plan',options:[],error:'Invalid',...props.value,onValueChange:change})]}):h(Dialog,{trigger:'打开',title:'详情',description:'',...props.value,onOpenChange:change})});app.config.errorHandler=error;app.mount(target);return{update:v=>props.value={...props.value,...v},cleanup:()=>app.unmount()}}`

   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
 console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}));
 }finally{await rm(folder,{recursive:true,force:true})}
})
