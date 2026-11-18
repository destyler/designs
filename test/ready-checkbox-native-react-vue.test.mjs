// Settled actual compiled Checkbox state versus native form semantics.
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

 const settle=()=>new Promise(r=>setTimeout(r,80));
 const native=document.createElement('input');native.type='checkbox';document.body.append(native);native.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));native.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true}));assert.equal(native.checked,false,'HappyDOM does not synthesize native Space activation; keyboard usability remains unverified');native.remove();
 const {run}=await import(pathToFileURL(process.argv[3]));
 for(const mode of ['accept','refuse','uncontrolled'])for(const initial of [false,true]){
  const form=document.createElement('form');document.body.append(form);const callbacks=[];const app=run(form,mode,initial,v=>callbacks.push(v));await settle();const input=form.querySelector('input');
  let expected=mode==='uncontrolled'?false:initial,disabled=false;const baseline=expected,expectedCallbacks=[];
  const check=stage=>{const context=`${mode}/${initial}/${stage}`;assert.equal(input.checked,expected,context);assert.equal(form.querySelector('[data-part=control]').getAttribute('data-state'),expected?'checked':'unchecked',context);assert.equal(input.disabled,disabled,context);assert.equal(input.required,true,context);assert.equal(form.checkValidity(),expected||disabled,context);assert.deepEqual([...new win.FormData(form)],expected&&!disabled?[['consent','on']]:[],context);assert.deepEqual(callbacks,expectedCallbacks,context)};check('initial');
  for(const target of ['input','control','label'])for(let i=0;i<2;i++){
   const requested=!expected;expectedCallbacks.push(requested);if(mode!=='refuse')expected=requested;
   (target==='input'?input:form.querySelector(`[data-part=${target}]`)).click();await settle();check(target+'click'+i)
  }
  input.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));input.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true}));await settle();check('space-events-without-simulated-default-activation');
  app.disabled(true);disabled=true;await settle();for(const target of ['input','control','label']){(target==='input'?input:form.querySelector(`[data-part=${target}]`)).click();await settle();check('disabled-'+target)}
  app.disabled(false);disabled=false;await settle();
  if(mode==='uncontrolled'){input.click();expected=!expected;expectedCallbacks.push(expected)}else{app.value(!initial);expected=!initial}
  await settle();check('nonpristine-before-reset');
  // A native cancelable reset event is prevented after mount. Neither callbacks nor controls change.
  form.addEventListener('reset',e=>e.preventDefault(),{once:true});form.reset();await settle();check('cancelled-reset');
  for(let i=0;i<2;i++){if(expected!==baseline){expectedCallbacks.push(baseline);if(mode!=='refuse')expected=baseline}form.reset();await settle();check('reset-'+i)}
  await app.cleanup();form.remove();await settle();
 }
 await win.happyDOM.close();
}else for(const framework of ['react','vue'])test(`Ready ${framework}: Checkbox click, controlled refusal, native form and reset contracts`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.checkbox-native-'));
 try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Checkbox} from '${source}';export function run(target,mode,initial,change){let api={};function App(){const [checked,set]=useState(initial),[disabled,disable]=useState(false);api.value=set;api.disabled=disable;return h(Checkbox,{label:'Consent',name:'consent',required:true,disabled,checked:mode==='uncontrolled'?undefined:checked,onCheckedChange:v=>{change(v);if(mode==='accept')set(v)}})}const root=createRoot(target);root.render(h(App));return{value:v=>api.value(v),disabled:v=>api.disabled(v),cleanup:()=>root.unmount()}}`

   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h,ref} from 'vue';import {Checkbox} from '${source}';export function run(target,mode,initial,change){const checked=ref(initial),disabled=ref(false);const app=createApp({render:()=>h(Checkbox,{label:'Consent',name:'consent',required:true,disabled:disabled.value,checked:mode==='uncontrolled'?undefined:checked.value,'onUpdate:checked':v=>{change(v);if(mode==='accept')checked.value=v}})});app.mount(target);return{value:v=>checked.value=v,disabled:v=>disabled.value=v,cleanup:()=>app.unmount()}}`

   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
 console.log(framework,execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000}));
 }finally{await rm(folder,{recursive:true,force:true})}
})
