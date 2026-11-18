// Real composite workflow in simulated DOM. Explicit submit dispatch tests the
// application validation handler, not browser submission/default activation.
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
 for(const theme of ['default','midnight']){
 const target=document.createElement('div');target.dataset.rdTheme=theme;document.body.append(target);const app=run(target);await settle();
 const dialog=()=>target.querySelector('[data-scope=dialog][data-part=content]'),dt=()=>target.querySelector('[data-scope=dialog][data-part=trigger]');
 dt().click();await settle();assert.equal(dt().getAttribute('aria-expanded'),'true');assert.equal(dialog().closest('[data-rd-theme]'),target);
 const form=target.querySelector('form'),input=form.querySelector('input'),native=form.querySelector('select'),trigger=form.querySelector('[data-scope=select][data-part=trigger]');
 const submit=async()=>{form.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));await settle()};
 assert.equal(form.checkValidity(),false);await submit();assert.deepEqual(app.submissions,[]);
 input.click();await settle();assert.equal(input.checked,true);assert.equal(form.checkValidity(),false);
 trigger.click();await settle();assert.equal(trigger.getAttribute('aria-expanded'),'true');assert.equal(form.querySelector('[data-scope=select][data-part=content]').closest('[data-rd-theme]'),target);
 form.querySelector('[data-part=item][data-value=b]').click();await settle();assert.equal(native.value,'b');assert.equal(form.checkValidity(),true);assert.deepEqual([...new win.FormData(form)],[['consent','on'],['choice','b']]);
 app.error('Choose another option');await settle();assert.equal(native.validationMessage,'Choose another option');assert.equal(form.checkValidity(),false);const id=trigger.getAttribute('aria-describedby');assert.ok(id&&id.split(/\s+/).some(id=>document.getElementById(id)?.textContent==='Choose another option'));await submit();assert.deepEqual(app.submissions,[]);
 app.error('');await settle();assert.equal(form.checkValidity(),true);await submit();assert.deepEqual(app.submissions,[[['consent','on'],['choice','b']]]);assert.equal(dt().getAttribute('aria-expanded'),'false');
 dt().click();await settle();assert.equal(input.checked,true);assert.equal(native.value,'b');
 target.querySelector('[data-scope=dialog][data-part=close-trigger]').click();await settle();assert.equal(dt().getAttribute('aria-expanded'),'false');dt().click();await settle();
 for(let i=0;i<2;i++){form.reset();await settle();assert.equal(input.checked,false);assert.equal(native.value,'');assert.deepEqual([...new win.FormData(form)],[['choice','']]);assert.equal(form.checkValidity(),false)}
 await submit();assert.equal(app.submissions.length,1);assert.equal(dt().getAttribute('aria-expanded'),'true');
 await app.cleanup();target.remove();await settle();
 }await win.happyDOM.close();
}else for(const framework of ['react','vue'])test(`Ready ${framework}: themed controlled dialog form flow`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.checkbox-native-'));
 try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Select,Checkbox,Dialog} from '${source}';export function run(target){const submissions=[];let setError;function App(){const [checked,C]=useState(false),[value,V]=useState(''),[open,O]=useState(false),[error,E]=useState('');setError=E;return h(Dialog,{trigger:'Open',title:'Preferences',open,onOpenChange:O},h('form',{onSubmit:e=>{e.preventDefault();if(e.currentTarget.checkValidity()){submissions.push([...new window.FormData(e.currentTarget)]);O(false)}}},h(Checkbox,{label:'Consent',name:'consent',required:true,checked,onCheckedChange:C}),h(Select,{label:'Choice',name:'choice',required:true,value,onValueChange:V,error,options:[{value:'a',label:'A'},{value:'b',label:'B'}]}),h('button',{type:'submit'},'Save')))}const root=createRoot(target);root.render(h(App));return {submissions,error:v=>setError(v),cleanup:()=>root.unmount()}}`


   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h,ref} from 'vue';import {Select,Checkbox,Dialog} from '${source}';export function run(target){const submissions=[],checked=ref(false),value=ref(''),open=ref(false),error=ref('');const app=createApp({render:()=>h(Dialog,{trigger:'Open',title:'Preferences',open:open.value,onOpenChange:v=>open.value=v},()=>h('form',{onSubmit:e=>{e.preventDefault();if(e.currentTarget.checkValidity()){submissions.push([...new window.FormData(e.currentTarget)]);open.value=false}}},[h(Checkbox,{label:'Consent',name:'consent',required:true,checked:checked.value,onCheckedChange:v=>checked.value=v}),h(Select,{label:'Choice',name:'choice',required:true,value:value.value,onValueChange:v=>value.value=v,error:error.value,options:[{value:'a',label:'A'},{value:'b',label:'B'}]}),h('button',{type:'submit'},'Save')]))});app.mount(target);return {submissions,error:v=>error.value=v,cleanup:()=>app.unmount()}}`


   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
 console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}));
 }finally{await rm(folder,{recursive:true,force:true})}
})
