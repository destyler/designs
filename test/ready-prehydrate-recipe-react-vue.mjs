// Opt-in application-bootstrap restoration recipe. Does not change Ready defaults.
// node test/ready-prehydrate-recipe-react-vue.mjs
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--server'){
  assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
  const {render}=await import(pathToFileURL(process.argv[3]));await writeFile(process.argv[4],await render())
}else if(process.argv[2]==='--client'){
  const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
  for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
  for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
  win.__readyEvents=[]
  const target=document.createElement('div');target.innerHTML=await readFile(process.argv[4],'utf8');document.body.append(target)
  const forms=[...target.querySelectorAll('form')]
  const snapshot=()=>forms.map(form=>{const input=form.querySelector('input'),select=form.querySelector('select'),data=new win.FormData(form);return {mode:form.dataset.mode,checked:input.checked,defaultChecked:input.defaultChecked,visualCheckbox:form.querySelector('[data-scope=checkbox][data-part=control]').getAttribute('data-state'),select:select.value,selectedDefaults:[...select.options].filter(option=>option.hasAttribute('selected')).map(option=>option.value),visualSelect:form.querySelector('[data-scope=select][data-part=value-text]').textContent,formUpdates:data.get('updates'),formPlan:data.get('plan')}})
  const stages=[{stage:'ssr',state:snapshot(),callbacks:[...win.__readyEvents]}]
  for(const form of forms){for(const [node,value] of [[form.querySelector('input'),true],[form.querySelector('select'),'b']]){if(node.tagName==='INPUT')node.checked=value;else node.value=value;node.dispatchEvent(new win.Event('input',{bubbles:true}));node.dispatchEvent(new win.Event('change',{bubbles:true}))}}
  stages.push({stage:'edited-before-hydrate',state:snapshot(),callbacks:[...win.__readyEvents]})
  const restored=Object.fromEntries(forms.map(form=>[form.dataset.mode,{updates:form.querySelector('[name=updates]').checked,plan:form.querySelector('[name=plan]').value}]))
  const beforeIds=[...target.querySelectorAll('[id]')].map(node=>node.id)
  const originalControls=[...target.querySelectorAll('form,input,select')]
  const warnings=[],original={warn:console.warn,error:console.error};console.warn=(...args)=>warnings.push(args.map(String).join(' '));console.error=(...args)=>warnings.push(args.map(String).join(' '))
  const {hydrate}=await import(pathToFileURL(process.argv[3]));const cleanup=hydrate(target,warnings,restored)
  stages.push({stage:'hydrate-returned',state:snapshot(),callbacks:[...win.__readyEvents]})
  const settle=()=>new Promise(resolve=>setTimeout(resolve,200));await settle()
  stages.push({stage:'hydration-settled',state:snapshot(),callbacks:[...win.__readyEvents]})
  assert.deepEqual([...target.querySelectorAll('[id]')].map(node=>node.id),beforeIds)
  assert.equal(new Set(beforeIds).size,beforeIds.length)
  const hydratedControls=[...target.querySelectorAll('form,input,select')];originalControls.forEach((node,index)=>assert.equal(node,hydratedControls[index]))
  assert.deepEqual(win.__readyEvents,[],'Bootstrap adoption is an explicit parent state update, not a fabricated user callback')
  for(const state of snapshot()){assert.equal(state.checked,true);assert.equal(state.visualCheckbox,'checked');assert.equal(state.select,'b');assert.equal(state.visualSelect,'B');assert.equal(state.formUpdates,'on');assert.equal(state.formPlan,'b')}
  for(const form of forms){form.querySelector('[data-scope=checkbox][data-part=control]').click();await settle()}
  stages.push({stage:'first-rendered-checkbox-click',state:snapshot(),callbacks:[...win.__readyEvents]})
  for(const state of snapshot()){assert.equal(state.checked,false);assert.equal(state.visualCheckbox,'unchecked');assert.equal(state.formUpdates,null)}
  assert.deepEqual(win.__readyEvents,[['controlled','checkbox',false],['controlled-empty','checkbox',false]])
  for(const form of forms){form.querySelector('[data-scope=select][data-part=trigger]').click();await settle();form.querySelector('[data-scope=select][data-part=item][data-value=a]').click();await settle()}
  stages.push({stage:'first-select-item-a-click',state:snapshot(),callbacks:[...win.__readyEvents]})
  for(const state of snapshot()){assert.equal(state.select,'a');assert.equal(state.visualSelect,'A');assert.equal(state.formPlan,'a')}
  assert.deepEqual(win.__readyEvents,[['controlled','checkbox',false],['controlled-empty','checkbox',false],['controlled','select','a'],['controlled-empty','select','a']])
  assert.deepEqual(warnings,[])
  await cleanup();await win.happyDOM.close();console.warn=original.warn;console.error=original.error
  await writeFile(process.argv[5],JSON.stringify({framework:process.argv[6],stages,warnings},null,2))
}else{
  const evidence=await mkdtemp('/tmp/ready-prehydrate-recipe-rv-');console.log(`Evidence: ${evidence}`)
  for(const framework of ['react','vue']){
    const folder=await mkdtemp(join(root,'node_modules/.ready-prehydrate-'))
    try{
      const source=`${root}packages/ready/${framework}`;let plugin,server,client
      if(framework==='react'){
        plugin=(await import('@vitejs/plugin-react')).default()
        await writeFile(join(folder,'App.tsx'),`import {useState,useEffect} from 'react';import {Checkbox,Select} from '${source}';function Scope({controlled,restored}){const [checked,setChecked]=useState(false),[value,setValue]=useState(controlled?'a':'');useEffect(()=>{if(restored){setChecked(restored.updates);setValue(restored.plan)}},[]);const mode=controlled?'controlled':'controlled-empty';return <form data-mode={mode} data-rd-theme="default"><Checkbox label="Updates" name="updates" checked={checked} onCheckedChange={v=>{window.__readyEvents.push([mode,'checkbox',v]);setChecked(v)}}/><Select label="Plan" name="plan" value={value} options={[{label:'A',value:'a'},{label:'B',value:'b'}]} onValueChange={v=>{window.__readyEvents.push([mode,'select',v]);setValue(v)}}/></form>}export default function App({restored={}}){return <><Scope controlled={true} restored={restored.controlled}/><Scope controlled={false} restored={restored['controlled-empty']}/></>}`)
        server=`import {createElement} from 'react';import {renderToString} from 'react-dom/server';import App from './App';export const render=()=>renderToString(createElement(App),{identifierPrefix:'restore-'})`
        client=`import {createElement} from 'react';import {hydrateRoot} from 'react-dom/client';import App from './App';export function hydrate(target,warnings,restored){const app=hydrateRoot(target,createElement(App,{restored}),{identifierPrefix:'restore-',onRecoverableError:error=>warnings.push(String(error))});return()=>app.unmount()}`
      }else{
        plugin=(await import('@vitejs/plugin-vue')).default()
        await writeFile(join(folder,'Scope.vue'),`<script setup>import {ref,onMounted} from 'vue';import {Checkbox,Select} from '${source}';const props=defineProps(['controlled','restored']);const mode=props.controlled?'controlled':'controlled-empty';const checked=ref(false),value=ref(props.controlled?'a':'');onMounted(()=>{if(props.restored){checked.value=props.restored.updates;value.value=props.restored.plan}});function check(v){window.__readyEvents.push([mode,'checkbox',v]);checked.value=v}function choose(v){window.__readyEvents.push([mode,'select',v]);value.value=v}</script><template><form :data-mode="mode" data-rd-theme="default"><Checkbox label="Updates" name="updates" :checked="checked" @update:checked="check"/><Select label="Plan" name="plan" :value="value" :options="[{label:'A',value:'a'},{label:'B',value:'b'}]" @update:value="choose"/></form></template>`)
        await writeFile(join(folder,'App.vue'),`<script setup>import Scope from './Scope.vue';defineProps({restored:{default:()=>({})}})</script><template><Scope :controlled="true" :restored="restored.controlled"/><Scope :controlled="false" :restored="restored['controlled-empty']"/></template>`)
        server=`import {createSSRApp} from 'vue';import {renderToString} from '@vue/server-renderer';import App from './App.vue';export function render(){const app=createSSRApp(App);app.config.idPrefix='restore';return renderToString(app)}`
        client=`import {createSSRApp} from 'vue';import App from './App.vue';export function hydrate(target,warnings,restored){const app=createSSRApp(App,{restored});app.config.idPrefix='restore';app.config.warnHandler=message=>warnings.push(message);app.mount(target);return()=>app.unmount()}`
      }
      const {build}=await import('vite');await writeFile(join(folder,'server.mjs'),server);await writeFile(join(folder,'client.mjs'),client)
      await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:join(folder,'server.mjs'),outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
      const html=join(evidence,`${framework}.html`);execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/server.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
      await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'client'),minify:false,lib:{entry:join(folder,'client.mjs'),formats:['es'],fileName:()=> 'client.mjs'}}})
      const result=join(evidence,`${framework}.json`);execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/client.mjs'),html,result,framework],{cwd:root,encoding:'utf8',timeout:30000})
      console.log(await readFile(result,'utf8'))
    }finally{await rm(folder,{recursive:true,force:true})}
  }
}
