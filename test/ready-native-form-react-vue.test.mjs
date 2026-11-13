import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--ssr'){
  assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
  const {render}=await import(pathToFileURL(process.argv[3]));const html=await render()
  const {Window}=await import('happy-dom');const win=new Window();win.document.body.innerHTML=html
  const form=win.document.querySelector('form'),input=form.querySelector('input'),select=form.querySelector('select'),trigger=form.querySelector('[data-scope=select][data-part=trigger]')
  const errors=[...form.querySelectorAll('.rd-error')];assert.equal(errors.length,2);assert.notEqual(errors[0].id,errors[1].id)
  for(const [node,index]of [[input,0],[trigger,1],[select,1]])assert.ok((node.getAttribute('aria-describedby')||'').split(/\s+/).includes(errors[index].id))
  assert.equal(input.getAttribute('aria-invalid'),'true');assert.equal(trigger.getAttribute('aria-invalid'),'true');assert.equal(input.required,true);assert.equal(select.required,true)
  assert.equal(input.checked,true);assert.equal(select.value,'a');assert.equal(form.checkValidity(),true,'SSR carries error text/ARIA, not client setCustomValidity')
  await win.happyDOM.close();console.log('PASS SSR error text and ARIA; custom validity is client-only')
}else if(process.argv[2]==='--worker'){
  const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
  for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
  for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
  const native=document.createElement('form');native.innerHTML='<input type="checkbox" name="updates" required><select name="plan" required><option value="">Choose</option><option value="a">A</option></select>';document.body.append(native)
  const nc=native.querySelector('input'),ns=native.querySelector('select')
  let nativeSubmits=0;native.addEventListener('submit',e=>{e.preventDefault();nativeSubmits++})
  assert.equal(native.checkValidity(),false);native.requestSubmit();assert.equal(nativeSubmits,0);nc.checked=true;ns.value='a';assert.equal(native.checkValidity(),true);native.requestSubmit();assert.equal(nativeSubmits,1)
  nc.disabled=ns.disabled=true;nc.checked=false;ns.value='';assert.equal(native.checkValidity(),true)
  // Characterize, not endorse: Happy DOM incorrectly includes disabled select in FormData.
  const simulatorIncludesDisabledSelect=new win.FormData(native).has('plan')
  console.log(JSON.stringify({nativeControl:{requiredValidity:true,disabledExcludedFromValidation:true,simulatorIncludesDisabledSelect}}))
  native.remove()
  const target=document.createElement('div');document.body.append(target)
  const {run}=await import(pathToFileURL(process.argv[3]));const app=run(target);const settle=()=>new Promise(r=>setTimeout(r,120));await settle()
  const form=target.querySelector('form'),input=form.querySelector('input'),select=form.querySelector('select')
  let submits=0;form.addEventListener('submit',e=>{e.preventDefault();submits++})
  const part=(family,name)=>form.querySelector(`[data-scope="${family}"][data-part="${name}"]`)
  assert.equal(input.required,true);assert.equal(select.required,true);assert.equal(part('select','trigger').getAttribute('aria-required'),'true');assert.equal(form.checkValidity(),false)
  assert.equal(input.validity.valueMissing,true);assert.equal(select.validity.valueMissing,true);form.requestSubmit();assert.equal(submits,0)
  part('checkbox','control').click();await settle();part('select','trigger').click();await settle();form.querySelector('[data-scope=select][data-part=item][data-value=a]').click();await settle()
  assert.equal(form.checkValidity(),true);assert.deepEqual([...new win.FormData(form)],[['updates','on'],['plan','a']]);form.requestSubmit();assert.equal(submits,1)
  const helpers=[...form.querySelectorAll('[data-scope=field][data-part=helper-text]')].map(node=>node.id)
  assert.equal(helpers.length,2)
  app.error('Please correct this field');await settle()
  assert.equal(input.validity.customError,true);assert.equal(select.validity.customError,true);assert.equal(form.checkValidity(),false);form.requestSubmit();assert.equal(submits,1,'Custom error blocks native submit')
  assert.equal(input.getAttribute('aria-invalid'),'true');assert.equal(part('select','trigger').getAttribute('aria-invalid'),'true')
  const errors=[...form.querySelectorAll('.rd-error')];assert.equal(errors.length,2);assert.notEqual(errors[0].id,errors[1].id)
  for(const [node,index] of [[input,0],[part('select','trigger'),1],[select,1]]){const ids=(node.getAttribute('aria-describedby')||'').split(/\s+/);assert.ok(ids.includes(helpers[index]),'Existing Field helper association is preserved');assert.ok(ids.includes(errors[index].id),'Own error is associated')}
  app.error('');await settle();assert.equal(input.validity.customError,false);assert.equal(select.validity.customError,false);assert.equal(form.checkValidity(),true);assert.equal(form.querySelectorAll('.rd-error').length,0);form.requestSubmit();assert.equal(submits,2,'Cleared error allows valid submission')
  assert.equal(input.getAttribute('aria-describedby'),helpers[0]);assert.equal(part('select','trigger').getAttribute('aria-describedby'),helpers[1])
  app.error('Still invalid');await settle()
  app.disable(true);await settle();assert.equal(input.disabled,true);assert.equal(select.disabled,true);assert.equal(part('select','trigger').disabled,true);assert.equal(form.checkValidity(),true)
  const disabledData=new win.FormData(form);assert.equal(disabledData.has('updates'),false);assert.equal(disabledData.has('plan'),simulatorIncludesDisabledSelect,'Ready matches native simulator; not proof of browser disabled serialization')
  app.error('');app.disable(false);await settle();form.reset();await settle();assert.equal(input.checked,false);assert.equal(select.value,'');assert.equal(input.validity.valueMissing,true);assert.equal(select.validity.valueMissing,true);assert.equal(form.checkValidity(),false)
  app.require(false);await settle();assert.equal(input.required,false);assert.equal(select.required,false);assert.equal(form.checkValidity(),true)
  app.error('Optional field rejected');await settle();assert.equal(form.checkValidity(),false);app.error('');await settle();assert.equal(form.checkValidity(),true)
  app.field(true);app.require(undefined);await settle()
  assert.equal(input.required,true,'Missing required inherits Field required');assert.equal(select.required,true);assert.equal(part('select','trigger').getAttribute('aria-required'),'true')
  assert.equal(input.getAttribute('aria-invalid'),'true');assert.equal(part('select','trigger').getAttribute('aria-invalid'),'true')
  app.error('Own error');await settle();app.error('');await settle()
  assert.equal(input.getAttribute('aria-invalid'),'true','Clearing own error preserves Field invalid');assert.equal(part('select','trigger').getAttribute('aria-invalid'),'true')
  assert.equal(input.getAttribute('aria-describedby'),helpers[0]);assert.equal(part('select','trigger').getAttribute('aria-describedby'),helpers[1])
  assert.equal(form.querySelectorAll('select').length,1)
  for(const [parent,child,expected] of [[undefined,undefined,false],[true,undefined,true],[false,undefined,false],[true,false,false],[false,true,true],[undefined,true,true],[undefined,false,false],[true,undefined,true],[false,undefined,false]]){
    app.parentDisable(parent);app.disable(child);await settle()
    const context=`parent disabled=${parent}, child disabled=${child}`
    assert.equal(input.disabled,expected,`Checkbox ${context}`)
    assert.equal(select.disabled,expected,`Select native ${context}`)
    assert.equal(part('select','trigger').disabled,expected,`Select trigger ${context}`)
  }
  await app.cleanup();await win.happyDOM.close();console.log('PASS Ready native required and disabled contracts')
}else for(const framework of ['react','vue'])test(`Ready ${framework}: native required/disabled/reset with simulator control`,{timeout:120000},async()=>{
  const folder=await mkdtemp(join(root,'node_modules/.ready-native-'))
  try{
    let plugin,code;const source=`${root}packages/ready/${framework}`
    if(framework==='react'){
      plugin=(await import('@vitejs/plugin-react')).default()
      code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Field} from '@destyler-ui/react';import {Checkbox,Select} from '${source}';export function run(target){let disable,error,require,field,parentDisable;function App(){const [disabled,set]=useState(false),[message,setError]=useState(''),[required,setRequired]=useState(true),[ancestor,setAncestor]=useState(false),[parentDisabled,setParentDisabled]=useState(undefined);disable=set;error=setError;require=setRequired;field=setAncestor;parentDisable=setParentDisabled;return h('form',null,h(Field.Root,{required:ancestor,invalid:ancestor,...(parentDisabled===undefined?{}:{disabled:parentDisabled})},h(Field.HelperText,null,'Checkbox help'),h(Checkbox,{label:'Updates',name:'updates',required,...(disabled===undefined?{}:{disabled}),error:message})),h(Field.Root,{required:ancestor,invalid:ancestor,...(parentDisabled===undefined?{}:{disabled:parentDisabled})},h(Field.HelperText,null,'Select help'),h(Select,{label:'Plan',name:'plan',required,...(disabled===undefined?{}:{disabled}),error:message,options:[{label:'A',value:'a'}]})))}const root=createRoot(target);root.render(h(App));return{disable:v=>disable(v),error:v=>error(v),require:v=>require(v),field:v=>field(v),parentDisable:v=>parentDisable(v),cleanup:()=>root.unmount()}}`
    }else{
      plugin=(await import('@vitejs/plugin-vue')).default()
      code=`import {createApp,h,ref} from 'vue';import {Field} from '@destyler-ui/vue';import {Checkbox,Select} from '${source}';export function run(target){const disabled=ref(false),error=ref(''),required=ref(true),ancestor=ref(false),parentDisabled=ref(undefined);const app=createApp({render:()=>h('form',[h(Field.Root,{required:ancestor.value,invalid:ancestor.value,...(parentDisabled.value===undefined?{}:{disabled:parentDisabled.value})},{default:()=>[h(Field.HelperText,null,{default:()=> 'Checkbox help'}),h(Checkbox,{label:'Updates',name:'updates',required:required.value,...(disabled.value===undefined?{}:{disabled:disabled.value}),error:error.value})]}),h(Field.Root,{required:ancestor.value,invalid:ancestor.value,...(parentDisabled.value===undefined?{}:{disabled:parentDisabled.value})},{default:()=>[h(Field.HelperText,null,{default:()=> 'Select help'}),h(Select,{label:'Plan',name:'plan',required:required.value,...(disabled.value===undefined?{}:{disabled:disabled.value}),error:error.value,options:[{label:'A',value:'a'}]})]})])});app.mount(target);return{disable:v=>disabled.value=v,error:v=>error.value=v,require:v=>required.value=v,field:v=>ancestor.value=v,parentDisable:v=>parentDisabled.value=v,cleanup:()=>app.unmount()}}`
    }
    const {build}=await import('vite');const entry=join(folder,'entry.mjs');await writeFile(entry,code)
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
    const output=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,/PASS Ready native/)
    const server=framework==='react'?`import {createElement as h} from 'react';import {renderToString} from 'react-dom/server';import {Checkbox,Select} from '${source}';export const render=()=>renderToString(h('form',null,h(Checkbox,{label:'Updates',checked:true,required:true,error:'Checkbox error'}),h(Select,{label:'Plan',value:'a',required:true,error:'Select error',options:[{label:'A',value:'a'}]})))`:`import {createSSRApp,h} from 'vue';import {renderToString} from '@vue/server-renderer';import {Checkbox,Select} from '${source}';export const render=()=>renderToString(createSSRApp({render:()=>h('form',[h(Checkbox,{label:'Updates',checked:true,required:true,error:'Checkbox error'}),h(Select,{label:'Plan',value:'a',required:true,error:'Select error',options:[{label:'A',value:'a'}]})])}))`
    const serverEntry=join(folder,'server.mjs');await writeFile(serverEntry,server)
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:serverEntry,outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
    assert.match(execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--ssr',join(folder,'server/server.mjs')],{cwd:root,encoding:'utf8',timeout:30000}),/PASS SSR/)

  }finally{await rm(folder,{recursive:true,force:true})}
})
