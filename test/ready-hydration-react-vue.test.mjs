import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))
if (process.argv[2] === '--server') {
  assert.equal(typeof window, 'undefined', 'SSR is executed without DOM globals')
  assert.equal(typeof document, 'undefined', 'SSR is executed without document')
  const { render } = await import(pathToFileURL(process.argv[3]))
  await writeFile(process.argv[4], await render())
} else if (process.argv[2] === '--client') {
  const { Window } = await import('happy-dom'); const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) if (['window','document','navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) { try { Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]}) } catch {} }
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key]=win[key].bind(win)
  const target=document.createElement('div');target.innerHTML=await readFile(process.argv[4],'utf8');document.body.append(target)
  const snapshot=()=>[...target.querySelectorAll('form')].map(form=>({theme:form.getAttribute('data-rd-theme'),checked:form.querySelector('input').checked,value:form.querySelector('select').value,submitted:new win.FormData(form).get('plan'),ids:[...form.querySelectorAll('[id]')].map(node=>node.id)}))
  for(const form of target.querySelectorAll('form')) {
    assert.equal(form.querySelectorAll('select').length,1,'Exactly one native select per composed control')
    assert.equal(form.querySelector('option[value=disabled]').disabled,true,'SSR keeps disabled options')
  }
  const before=snapshot(), firstNode=target.firstChild
  const originalControls=[...target.querySelectorAll('form,input,select,[data-scope=dialog][data-part=content]')]
  for(const form of target.querySelectorAll('form'))for(const node of form.querySelectorAll('[aria-labelledby],[aria-describedby]'))for(const attr of ['aria-labelledby','aria-describedby'])for(const id of (node.getAttribute(attr)||'').split(/\s+/).filter(Boolean))assert.ok(document.getElementById(id),`SSR ${attr}: ${id}`)
  const warnings=[];const original={warn:console.warn,error:console.error};console.warn=(...args)=>warnings.push(args.map(String).join(' '));console.error=(...args)=>warnings.push(args.map(String).join(' '))
  const { hydrate }=await import(pathToFileURL(process.argv[3]));const cleanup=hydrate(target,warnings)
  const settle=()=>new Promise(resolve=>setTimeout(resolve,150));await settle()
  const after=snapshot();console.warn=original.warn;console.error=original.error
  console.log(JSON.stringify({before,after,warnings,reused:firstNode===target.firstChild}))
  const forms=[...target.querySelectorAll('form')]
  for(const form of forms){
    const part=(family,name)=>form.querySelector(`[data-scope="${family}"][data-part="${name}"]`)
    const was=form.querySelector('input').checked;part('checkbox','control').click();await settle();assert.equal(form.querySelector('input').checked,!was)
    part('select','trigger').click();await settle();form.querySelector('[data-scope="select"][data-part="item"][data-value="b"]').click();await settle();assert.equal(new win.FormData(form).get('plan'),'b')
    part('dialog','trigger').click();await settle();assert.equal(part('dialog','trigger').getAttribute('aria-expanded'),'true');part('dialog','close-trigger').click();await settle();assert.equal(part('dialog','trigger').getAttribute('aria-expanded'),'false')
    for(const node of form.querySelectorAll('[aria-labelledby],[aria-describedby]'))for(const attr of ['aria-labelledby','aria-describedby'])for(const id of (node.getAttribute(attr)||'').split(/\s+/).filter(Boolean))assert.ok(document.getElementById(id),`${attr}: ${id}`)
  }
  assert.equal(firstNode,target.firstChild,'Hydration must reuse SSR DOM')
  const hydratedControls=[...target.querySelectorAll('form,input,select,[data-scope=dialog][data-part=content]')]
  assert.equal(hydratedControls.length,originalControls.length)
  originalControls.forEach((node,index)=>assert.equal(node,hydratedControls[index],'Hydration reuses original form/control nodes'))
  assert.deepEqual(warnings,[],'Hydration emits no warnings/recoverable errors')
  assert.deepEqual(after,before,'Hydration preserves IDs and native form state')
  assert.deepEqual(before.map(({theme,checked,value,submitted})=>({theme,checked,value,submitted})),[{theme:'default',checked:true,value:'a',submitted:'a'},{theme:'midnight',checked:false,value:'b',submitted:'b'},{theme:'default',checked:false,value:'',submitted:''}])
  const ids=before.flatMap(item=>item.ids);assert.equal(new Set(ids).size,ids.length)
  await cleanup();await win.happyDOM.close();console.log('PASS real SSR and simulated hydration')
} else for(const framework of ['react','vue']) test(`Ready ${framework}: real SSR to simulated hydration`,{timeout:120000},async()=>{
  const folder=await mkdtemp(join(root,'node_modules/.ready-hydration-'))
  try{
    const source=`${root}packages/ready/${framework}`
    let plugin,server,client
    if(framework==='react'){
      plugin=(await import('@vitejs/plugin-react')).default()
      await writeFile(join(folder,'App.tsx'),`import {useState} from 'react';import {Checkbox,Select,Dialog} from '${source}';function Scope({theme,initialChecked,initialValue}){const [checked,setChecked]=useState(initialChecked),[value,setValue]=useState(initialValue),[open,setOpen]=useState(false);return <form data-rd-theme={theme}><Checkbox label="Updates" name="updates" checked={checked} onCheckedChange={setChecked}/><Select label="Plan" name="plan" value={value} onValueChange={setValue} options={[{label:'A',value:'a'},{label:'B',value:'b'},{label:'Disabled',value:'disabled',disabled:true}]}/><Dialog trigger="Open" title="Preferences" description="Account options" open={open} onOpenChange={setOpen}><p>Body</p></Dialog></form>}export default function App(){return <><Scope theme="default" initialChecked={true} initialValue="a"/><Scope theme="midnight" initialChecked={false} initialValue="b"/><Scope theme="default" initialChecked={false} initialValue=""/></>}`)
      server=`import {createElement} from 'react';import {renderToString} from 'react-dom/server';import App from './App';export const render=()=>renderToString(createElement(App),{identifierPrefix:'ready-'})`
      client=`import {createElement} from 'react';import {hydrateRoot} from 'react-dom/client';import App from './App';export function hydrate(target,warnings){const root=hydrateRoot(target,createElement(App),{identifierPrefix:'ready-',onRecoverableError:error=>warnings.push(String(error))});return()=>root.unmount()}`
    }else{
      plugin=(await import('@vitejs/plugin-vue')).default()
      await writeFile(join(folder,'Scope.vue'),`<script setup>import {ref} from 'vue';import {Checkbox,Select,Dialog} from '${source}';const props=defineProps(['theme','initialChecked','initialValue']);const checked=ref(props.initialChecked),value=ref(props.initialValue),open=ref(false)</script><template><form :data-rd-theme="theme"><Checkbox label="Updates" name="updates" v-model:checked="checked"/><Select label="Plan" name="plan" v-model:value="value" :options="[{label:'A',value:'a'},{label:'B',value:'b'},{label:'Disabled',value:'disabled',disabled:true}]"/><Dialog trigger="Open" title="Preferences" description="Account options" v-model:open="open"><p>Body</p></Dialog></form></template>`)
      await writeFile(join(folder,'App.vue'),`<script setup>import Scope from './Scope.vue'</script><template><Scope theme="default" :initial-checked="true" initial-value="a"/><Scope theme="midnight" :initial-checked="false" initial-value="b"/><Scope theme="default" :initial-checked="false" initial-value=""/></template>`)
      server=`import {createSSRApp} from 'vue';import {renderToString} from '@vue/server-renderer';import App from './App.vue';export function render(){const app=createSSRApp(App);app.config.idPrefix='ready';return renderToString(app)}`
      client=`import {createSSRApp} from 'vue';import App from './App.vue';export function hydrate(target,warnings){const app=createSSRApp(App);app.config.idPrefix='ready';app.config.warnHandler=message=>warnings.push(message);app.mount(target);return()=>app.unmount()}`
    }
    const {build}=await import('vite')
    await writeFile(join(folder,'server.mjs'),server);await writeFile(join(folder,'client.mjs'),client)
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:join(folder,'server.mjs'),outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
    const html=join(folder,'ssr.html');execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/server.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'client'),minify:false,lib:{entry:join(folder,'client.mjs'),formats:['es'],fileName:()=> 'client.mjs'}}})
    const output=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/client.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,/PASS real SSR/)
  }finally{await rm(folder,{recursive:true,force:true})}
})
