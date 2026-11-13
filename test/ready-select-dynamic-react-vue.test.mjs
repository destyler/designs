// Pending requested keys render an empty effective value until an option arrives.
// node --test --test-concurrency=1 test/ready-select-dynamic-react-vue.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--server'){
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 const {render}=await import(pathToFileURL(process.argv[3]));const html=await render()
 const {Window}=await import('happy-dom');const win=new Window();win.document.body.innerHTML=html
 const form=win.document.querySelector('form'),select=form.querySelector('select')
 await writeFile(process.argv[4],JSON.stringify({requestedValue:'z',options:['a','b'],html,visible:form.querySelector('[data-part=value-text]').textContent,nativeValue:select.value,selectedIndex:select.selectedIndex,serializedSelected:[...select.options].filter(o=>o.hasAttribute('selected')).map(o=>o.value),effectiveSelected:[...select.options].filter(o=>o.selected).map(o=>o.value),required:select.required,valueMissing:select.validity.valueMissing,submitted:[...new win.FormData(form)]},null,2));await win.happyDOM.close()
}else if(process.argv[2]==='--worker'){
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
 const {run}=await import(pathToFileURL(process.argv[3])),results=[]
 const initial=[{value:'a',label:'A'},{value:'b',label:'B'},{value:'c',label:'C'}]
 const settle=()=>new Promise(r=>setTimeout(r,160))
 for(const mode of ['controlled','uncontrolled','async','missing']){
  const form=document.createElement('form');document.body.append(form);const callbacks=[];const api=run(form,mode,initial,value=>callbacks.push(value));await settle()
  const states=[];const capture=stage=>{const select=form.querySelector('select');states.push({stage,visible:form.querySelector('[data-scope=select][data-part=value-text]').textContent,nativeValue:select.value,selectedIndex:select.selectedIndex,submitted:[...new win.FormData(form)],options:[...select.options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled,selected:o.selected,defaultSelected:o.defaultSelected})),callbacks:[...callbacks]})}
  capture('initial')
  if(mode==='uncontrolled'){form.querySelector('[data-part=trigger]').click();await settle();form.querySelector('[data-part=item][data-value=b]').click();await settle();capture('user-selected-b')}
  if(mode==='async'){api.options(initial);await settle();capture('loaded-options-for-controlled-b')}
  else if(mode==='missing'){api.value('z');await settle();capture('parent-value-z-not-in-options');api.options([...initial,{value:'z',label:'Z'}]);await settle();capture('missing-z-option-arrives');api.value('b');await settle();capture('parent-restores-b')}
  else{
   api.options([{value:'c',label:'C'},{value:'b',label:'Bee'},{value:'a',label:'A'}]);await settle();capture('reordered-and-relabeled-b')
   api.options([{value:'a',label:'A'},{value:'c',label:'C'}]);await settle();capture('selected-b-removed')
   api.options([{value:'a',label:'A'},{value:'b',label:'B restored'},{value:'c',label:'C'}]);await settle();capture('b-reinserted')
   api.options([{value:'a',label:'A'},{value:'b',label:'B disabled',disabled:true},{value:'c',label:'C'}]);await settle();capture('selected-b-disabled')
   api.options(initial);await settle();capture('b-enabled-again')
   api.options([{value:'a',label:'A'},{value:'c',label:'C'}]);await settle();capture('removed-before-user-replacement')
   form.querySelector('[data-part=trigger]').click();await settle();form.querySelector('[data-part=item][data-value=a]').click();await settle();capture('user-selects-a-instead-of-pending-b')
   api.options(initial);await settle();capture('b-returns-after-user-choice-a')
  }
  results.push({mode,states});await api.cleanup();form.remove();await settle()
 }
 const native=document.createElement('form');native.innerHTML='<select name="plan"><option value="a">A</option><option value="b" selected disabled>B</option></select>';document.body.append(native)
 const baseline={value:native.querySelector('select').value,submitted:[...new win.FormData(native)],note:'Disabled option serialization is a HappyDOM observation, not proof of browser successful-control behavior.'}
 native.querySelector('select').value='missing';const noSelection={value:native.querySelector('select').value,selectedIndex:native.querySelector('select').selectedIndex,submitted:[...new win.FormData(native)],note:'HappyDOM no-selection serialization observation, not a browser conformance claim.'}
 await win.happyDOM.close();await writeFile(process.argv[4],JSON.stringify({framework:process.argv[5],results,nativeDisabledOptionBaseline:baseline,nativeNoSelectionBaseline:noSelection},null,2))
}else{
 const evidence=await mkdtemp('/tmp/ready-dynamic-rv-');console.log(`Evidence: ${evidence}`)
 for(const framework of ['react','vue'])test(`Ready ${framework}: dynamic options and missing-value SSR`,{timeout:120000},async()=>{
  const folder=await mkdtemp(join(root,'node_modules/.ready-dynamic-'))
  try{
   const source=`${root}packages/ready/${framework}`;let plugin,code
   if(framework==='react'){
    plugin=(await import('@vitejs/plugin-react')).default()
    code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Select} from '${source}';export function run(target,mode,initial,change){let api={};function App(){const [options,setOptions]=useState(mode==='async'?[]:initial),[value,setValue]=useState('b');api.options=setOptions;api.value=setValue;return h(Select,{name:'plan',label:'Plan',options,value:mode==='uncontrolled'?undefined:value,onValueChange:v=>{change(v);if(mode!=='uncontrolled')setValue(v)}})}const root=createRoot(target);root.render(h(App));return{options:v=>api.options(v),value:v=>api.value(v),cleanup:()=>root.unmount()}}`
   }else{
    plugin=(await import('@vitejs/plugin-vue')).default()
    code=`import {createApp,h,ref} from 'vue';import {Select} from '${source}';export function run(target,mode,initial,change){const options=ref(mode==='async'?[]:initial),value=ref('b');const app=createApp({render:()=>h(Select,{name:'plan',label:'Plan',options:options.value,value:mode==='uncontrolled'?undefined:value.value,'onUpdate:value':v=>{change(v);if(mode!=='uncontrolled')value.value=v}})});app.mount(target);return{options:v=>options.value=v,value:v=>value.value=v,cleanup:()=>app.unmount()}}`
   }
   const {build}=await import('vite'),entry=join(folder,'entry.mjs');await writeFile(entry,code)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
   const result=join(evidence,`${framework}.json`);execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs'),result,framework],{cwd:root,encoding:'utf8',timeout:30000});const report=JSON.parse(await readFile(result,'utf8'))
   for(const {mode,states} of report.results){
    for(const state of states){
     const pending=['selected-b-removed','parent-value-z-not-in-options','removed-before-user-replacement'].includes(state.stage)||(mode==='async'&&state.stage==='initial')||(mode==='uncontrolled'&&state.stage==='initial')
     const replacement=['user-selects-a-instead-of-pending-b','b-returns-after-user-choice-a'].includes(state.stage)
     const value=pending?'':replacement?'a':state.stage==='missing-z-option-arrives'?'z':'b'
     const label=pending?'Choose an option':state.stage==='reordered-and-relabeled-b'?'Bee':state.stage==='b-reinserted'?'B restored':state.stage==='selected-b-disabled'?'B disabled':value==='z'?'Z':replacement?'A':'B'
     assert.equal(state.visible,label,`${mode}/${state.stage}: visible value`);assert.equal(state.nativeValue,value);
     // HappyDOM serializes disabled options incorrectly; compare its native control, not browser semantics.
     assert.deepEqual(state.submitted,state.stage==='selected-b-disabled'?report.nativeDisabledOptionBaseline.submitted:[['plan',value]])
     assert.ok(state.selectedIndex>=0,'An explicit native option always represents the effective selection')
     const callbacks=mode==='uncontrolled'&&state.stage!=='initial'?['b']:[];if(replacement)callbacks.push('a');assert.deepEqual(state.callbacks,callbacks,'Option changes do not fabricate user changes')
     if(state.stage==='selected-b-disabled')assert.equal(state.options.find(option=>option.value==='b').disabled,true)
    }
   }
   const server=framework==='react'?`import {createElement as h} from 'react';import {renderToString} from 'react-dom/server';import {Select} from '${source}';export const render=()=>renderToString(h('form',null,h(Select,{label:'Plan',name:'plan',value:'z',required:true,options:[{label:'A',value:'a'},{label:'B',value:'b'}]})))`:`import {createSSRApp,h} from 'vue';import {renderToString} from '@vue/server-renderer';import {Select} from '${source}';export const render=()=>renderToString(createSSRApp({render:()=>h('form',[h(Select,{label:'Plan',name:'plan',value:'z',required:true,options:[{label:'A',value:'a'},{label:'B',value:'b'}]})])}))`
   const serverEntry=join(folder,'server.mjs');await writeFile(serverEntry,server)
   await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:serverEntry,outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
   const missing=join(evidence,`${framework}-ssr-missing.json`);execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/server.mjs'),missing],{cwd:root,encoding:'utf8',timeout:30000});const ssr=JSON.parse(await readFile(missing,'utf8'));assert.equal(ssr.requestedValue,'z');assert.equal(ssr.visible,'Choose an option');assert.equal(ssr.nativeValue,'');assert.deepEqual(ssr.effectiveSelected,['']);assert.equal(ssr.required,true);assert.equal(ssr.valueMissing,true);assert.deepEqual(ssr.submitted,[['plan','']]);assert.match(ssr.html,/<option[^>]*value=""/)

  }finally{await rm(folder,{recursive:true,force:true})}
 })
}
