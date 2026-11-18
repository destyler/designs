// Opt-in application experiment; no changes to Ready's public API/default behavior.
// Run: node test/ready-restore-policy-react-vue.mjs
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--server'){
  assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
  const {render}=await import(pathToFileURL(process.argv[3]));await writeFile(process.argv[4],await render())
}else if(process.argv[2]==='--client'){
  const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
  for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
  for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
  const scenario=process.argv[6],target=document.createElement('div');target.innerHTML=await readFile(process.argv[4],'utf8');document.body.append(target);win.__events=[]
  const form=target.querySelector('form'),input=form.querySelector('input'),select=form.querySelector('select')
  const capture=()=>{
    const entries=[...form.querySelectorAll('[data-restore-key]')].map(field=>{const node=field.querySelector('input,select');return [field.dataset.restoreKey,{kind:node.tagName==='INPUT'?'checkbox':'select',value:node.tagName==='INPUT'?node.checked:node.value}]})
    assert.equal(new Set(entries.map(([key])=>key)).size,entries.length,'Duplicate restoration keys must be rejected')
    return Object.fromEntries(entries)
  }
  const snapshot=()=>({fields:capture(),visualCheckbox:form.querySelector('[data-scope=checkbox][data-part=control]').getAttribute('data-state'),visualSelect:form.querySelector('[data-scope=select][data-part=value-text]').textContent,submitted:[...new win.FormData(form).entries()],callbacks:[...win.__events]})
  const baseline=capture();const stages=[{stage:'ssr',...snapshot()}]
  // Same HTML name is deliberate: stable explicit keys, not form names, own identity.
  assert.equal(input.name,select.name)
  input.checked=true;select.value='b';for(const node of [input,select]){node.dispatchEvent(new win.Event('input',{bubbles:true}));node.dispatchEvent(new win.Event('change',{bubbles:true}))}
  const captured=capture();stages.push({stage:'captured',...snapshot()})
  if(scenario==='stale'){input.checked=false;select.value='c';stages.push({stage:'edited-after-capture',...snapshot()})}
  const {hydrate}=await import(pathToFileURL(process.argv[3]))
  const current=capture(),stale=JSON.stringify(current)!==JSON.stringify(captured)
  if(stale){
    assert.equal(scenario,'stale');assert.equal(select.value,'c');assert.equal(input.checked,false)
    await writeFile(process.argv[5],JSON.stringify({scenario,status:'blocked-before-hydration',decision:'cancel-stale-adoption',adopted:false,stages,limitations:'Hydration deliberately not started. Current DOM values retained; application must obtain a new decision. No claim of visual/native reconciliation while gated.'},null,2));await win.happyDOM.close()
  }else{
    assert.ok(['accept','reject','late-edit'].includes(scenario),'A fresh snapshot alone does not authorize adoption or rejection')
    const warnings=[],original={warn:console.warn,error:console.error};console.warn=(...a)=>warnings.push(a.map(String).join(' '));console.error=(...a)=>warnings.push(a.map(String).join(' '))
    const ids=[...target.querySelectorAll('[id]')].map(n=>n.id),nodes=[...target.querySelectorAll('form,input,select')]
    const cleanup=hydrate(target,warnings,{decision:scenario==='late-edit'?'accept':scenario,snapshot:captured})
    if(scenario==='late-edit'){input.checked=false;select.value='c';stages.push({stage:'property-edit-after-hydrate-return-before-settled',...snapshot()})}
    const settle=()=>new Promise(r=>setTimeout(r,200));await settle();stages.push({stage:'hydrated-before-explicit-repair',...snapshot()})
    if(scenario==='late-edit'){
      // Deliberately observed negative case: the pre-hydration compare cannot guard this window.
      await cleanup();await win.happyDOM.close();console.warn=original.warn;console.error=original.error
      await writeFile(process.argv[5],JSON.stringify({scenario,status:'late-edit-race-observed-not-solved',stages,warnings,limitations:'A deliberate hook edits properties after hydrate returns, before scheduled work settles; Vue onMounted may already have run. This does not model interruption of synchronous hydration. No event is emitted, and this experiment does not serialize adoption or preserve these late edits.'},null,2));process.exit(0)
    }
    if(scenario==='reject'){
      // Explicit application/user refusal authorizes this one-time DOM reconciliation.
      // This is NOT automatic behavior for a merely stale or unacknowledged snapshot.
      input.checked=baseline['prefs.updates'].value;select.value=baseline['prefs.plan'].value
      stages.push({stage:'explicit-rejection-native-repair',...snapshot()})
    }
    const expect=(checked,value)=>{assert.equal(input.checked,checked);assert.equal(select.value,value);assert.equal(form.querySelector('[data-scope=checkbox][data-part=control]').getAttribute('data-state'),checked?'checked':'unchecked');assert.equal(form.querySelector('[data-scope=select][data-part=value-text]').textContent,value.toUpperCase());assert.deepEqual([...new win.FormData(form).entries()],checked?[['shared','on'],['shared',value]]:[['shared',value]])}
    expect(scenario==='accept',scenario==='accept'?'b':'a');assert.deepEqual(win.__events,[],'Parent bootstrap/explicit native repair emits no fabricated user callbacks')
    assert.deepEqual([...target.querySelectorAll('[id]')].map(n=>n.id),ids);assert.equal(new Set(ids).size,ids.length);nodes.forEach((node,i)=>assert.equal(node,[...target.querySelectorAll('form,input,select')][i]))
    form.querySelector('[data-scope=checkbox][data-part=control]').click();await settle();expect(scenario!=='accept',scenario==='accept'?'b':'a');assert.deepEqual(win.__events,[['checkbox',scenario!=='accept']]);stages.push({stage:'first-checkbox-click',...snapshot()})
    form.querySelector('[data-scope=select][data-part=trigger]').click();await settle();form.querySelector('[data-scope=select][data-part=item][data-value=c]').click();await settle();expect(scenario!=='accept','c');assert.deepEqual(win.__events,[['checkbox',scenario!=='accept'],['select','c']]);stages.push({stage:'first-select-choice-c',...snapshot()})
    // Selected policy: actual form.reset returns to initial SSR false/a, not the accepted restoration.
    form.reset();await settle();expect(false,'a');stages.push({stage:'reset-to-original-ssr-baseline',...snapshot()})
    assert.deepEqual(warnings,[]);await cleanup();await win.happyDOM.close();console.warn=original.warn;console.error=original.error
    await writeFile(process.argv[5],JSON.stringify({scenario,status:'verified-simulated-recipe',decision:scenario,stages,warnings,limitations:'Explicit controlled application policy only. HappyDOM reset timing and hydration are not real-browser restoration or focus/visual acceptance.'},null,2))
  }
}else{
  const evidence=await mkdtemp('/tmp/ready-restore-policy-rv-');console.log(`Evidence: ${evidence}`)
  for(const framework of ['react','vue']){
    const folder=await mkdtemp(join(root,'node_modules/.ready-policy-'))
    try{
      const source=`${root}packages/ready/${framework}`;let plugin,server,client
      if(framework==='react'){
        plugin=(await import('@vitejs/plugin-react')).default()
        await writeFile(join(folder,'App.tsx'),`import {useState,useEffect} from 'react';import {Checkbox,Select} from '${source}';export default function App({policy}){const [checked,setChecked]=useState(false),[value,setValue]=useState('a');useEffect(()=>{if(policy?.decision==='accept'){setChecked(policy.snapshot['prefs.updates'].value);setValue(policy.snapshot['prefs.plan'].value)}},[]);return <form data-rd-theme="default"><div data-restore-key="prefs.updates"><Checkbox label="Updates" name="shared" checked={checked} onCheckedChange={v=>{window.__events.push(['checkbox',v]);setChecked(v)}}/></div><div data-restore-key="prefs.plan"><Select label="Plan" name="shared" value={value} options={[{label:'A',value:'a'},{label:'B',value:'b'},{label:'C',value:'c'}]} onValueChange={v=>{window.__events.push(['select',v]);setValue(v)}}/></div></form>}`)
        server=`import {createElement} from 'react';import {renderToString} from 'react-dom/server';import App from './App';export const render=()=>renderToString(createElement(App),{identifierPrefix:'policy-'})`
        client=`import {createElement} from 'react';import {hydrateRoot} from 'react-dom/client';import App from './App';export function hydrate(target,warnings,policy){const app=hydrateRoot(target,createElement(App,{policy}),{identifierPrefix:'policy-',onRecoverableError:e=>warnings.push(String(e))});return()=>app.unmount()}`
      }else{
        plugin=(await import('@vitejs/plugin-vue')).default()
        await writeFile(join(folder,'App.vue'),`<script setup>import {ref,onMounted} from 'vue';import {Checkbox,Select} from '${source}';const props=defineProps(['policy']);const checked=ref(false),value=ref('a');onMounted(()=>{if(props.policy?.decision==='accept'){checked.value=props.policy.snapshot['prefs.updates'].value;value.value=props.policy.snapshot['prefs.plan'].value}});function check(v){window.__events.push(['checkbox',v]);checked.value=v}function choose(v){window.__events.push(['select',v]);value.value=v}</script><template><form data-rd-theme="default"><div data-restore-key="prefs.updates"><Checkbox label="Updates" name="shared" :checked="checked" @update:checked="check"/></div><div data-restore-key="prefs.plan"><Select label="Plan" name="shared" :value="value" @update:value="choose" :options="[{label:'A',value:'a'},{label:'B',value:'b'},{label:'C',value:'c'}]"/></div></form></template>`)
        server=`import {createSSRApp} from 'vue';import {renderToString} from '@vue/server-renderer';import App from './App.vue';export function render(){const app=createSSRApp(App);app.config.idPrefix='policy';return renderToString(app)}`
        client=`import {createSSRApp} from 'vue';import App from './App.vue';export function hydrate(target,warnings,policy){const app=createSSRApp(App,{policy});app.config.idPrefix='policy';app.config.warnHandler=m=>warnings.push(m);app.mount(target);return()=>app.unmount()}`
      }
      const {build}=await import('vite');await writeFile(join(folder,'server.mjs'),server);await writeFile(join(folder,'client.mjs'),client)
      await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:join(folder,'server.mjs'),outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
      const html=join(evidence,`${framework}.html`);execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/server.mjs'),html],{cwd:root,encoding:'utf8',timeout:30000})
      await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'client'),minify:false,lib:{entry:join(folder,'client.mjs'),formats:['es'],fileName:()=> 'client.mjs'}}})
      for(const scenario of ['stale','accept','reject','late-edit']){const result=join(evidence,`${framework}-${scenario}.json`);execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/client.mjs'),html,result,scenario],{cwd:root,encoding:'utf8',timeout:30000});console.log(framework,scenario,JSON.parse(await readFile(result,'utf8')).status)}
    }finally{await rm(folder,{recursive:true,force:true})}
  }
}
