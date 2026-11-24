import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const file = fileURLToPath(import.meta.url)
const repo = fileURLToPath(new URL('../', import.meta.url))
const ready = join(repo, 'packages/ready')
const data = `const items = [{id:'start',label:'Details',description:'Enter details'},{id:'review',label:'Review'}]`
const fixtures = {
  react: `import {useState} from 'react';import {Steps} from '${ready}/react/Steps';${data};export default function App(){const [step,setStep]=useState(0),[request,requestStep]=useState(-1);return <form id="wizard"><Steps label="Wizard" items={items} completedLabel="Done"/><Steps label="Controlled" items={items} step={step} onStepChange={requestStep}/><Steps label="Starts later" items={items} defaultStep={1} finishLabel="Submit for review"/><button type="button" id="accept" onClick={()=>setStep(request)}>Accept requested step</button><output>{request}</output></form>}`,
  solid: `import {createSignal} from 'solid-js';import {Steps} from '${ready}/solid/Steps';${data};export default function App(){const [step,setStep]=createSignal(0),[request,requestStep]=createSignal(-1);return <form id="wizard"><Steps label="Wizard" items={items} completedLabel="Done"/><Steps label="Controlled" items={items} step={step()} onStepChange={requestStep}/><Steps label="Starts later" items={items} defaultStep={1} finishLabel="Submit for review"/><button type="button" id="accept" onClick={()=>setStep(request())}>Accept requested step</button><output>{request()}</output></form>}`,
  vue: `<script setup>import {ref} from 'vue';import Steps from '${ready}/vue/Steps.vue';${data};const step=ref(0),request=ref(-1)</script><template><form id="wizard"><Steps label="Wizard" :items="items" completed-label="Done"/><Steps label="Controlled" :items="items" :step="step" @step-change="request=$event"/><Steps label="Starts later" :items="items" :default-step="1" finish-label="Submit for review"/><button type="button" id="accept" @click="step=request">Accept requested step</button><output>{{request}}</output></form></template>`,
  svelte: `<script>import Steps from '${ready}/svelte/Steps.svelte';${data};let step=$state(0),request=$state(-1)</script><form id="wizard"><Steps label="Wizard" {items} completedLabel="Done"/><Steps label="Controlled" {items} {step} onStepChange={value=>request=value}/><Steps label="Starts later" {items} defaultStep={1} finishLabel="Submit for review"/><button type="button" id="accept" onclick={()=>step=request}>Accept requested step</button><output>{request}</output></form>`,
}

const eventually = async check => {
  const deadline = Date.now() + 2500
  for (;;) {
    try { check(); return } catch (error) {
      if (Date.now() >= deadline) throw error
      await new Promise(resolve => setTimeout(resolve, 15))
    }
  }
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url:'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) if (/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(key)) {
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})
  }
  globalThis.window = win
  globalThis.document = win.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  document.body.innerHTML = '<main id="app"></main>'
  const { dispose, prepareSteps, validateStepsIndex } = await import(pathToFileURL(process.argv[3]))
  assert.throws(()=>prepareSteps({label:'Name',items:[]}),/nonempty/)
  assert.throws(()=>prepareSteps({label:'Name',items:[{id:'x',label:'One'},{id:'x',label:'Two'}]}),/unique/)
  assert.throws(()=>prepareSteps({label:'Name',items:[{id:'x',label:'One'}],finishLabel:' '}),/finishLabel/)
  assert.throws(()=>validateStepsIndex(0.5,2,'step'),/integer/)
  assert.throws(()=>validateStepsIndex(3,2,'defaultStep'),/integer/)
  await eventually(() => assert.equal(document.querySelectorAll('nav').length,3))
  const nav = name => document.querySelector(`nav[aria-label="${name}"]`)
  const [wizard,controlled,later] = ['Wizard','Controlled','Starts later'].map(nav)
  const current = scope => scope.querySelector('[aria-current=step]')?.firstChild.textContent.trim()
  const actions = scope => [...scope.querySelectorAll('button')]
  const [prev,next] = actions(wizard)
  const [,request] = actions(controlled)
  const form = document.getElementById('wizard')
  let submissions = 0
  form.addEventListener('submit', event => { event.preventDefault(); submissions++ })
  assert.equal(wizard.querySelector('ol').getAttribute('aria-label'),'Wizard')
  assert.equal(wizard.querySelectorAll('ol > li').length,2)
  assert.equal(wizard.querySelectorAll('[role=tab],[role=tablist]').length,0)
  assert.equal(wizard.querySelector('li p')?.textContent,'Enter details')
  assert.equal(current(wizard),'Details')
  assert.equal(current(later),'Review')
  assert.equal(actions(later)[1].textContent,'Submit for review')
  assert.deepEqual(actions(wizard).map(button=>button.type),['button','button'])
  assert.equal(prev.disabled,true)
  assert.equal(next.textContent,'Next')
  next.click()
  await eventually(() => assert.equal(current(wizard),'Review'))
  assert.equal(wizard.querySelectorAll('li[data-complete]').length,1)
  assert.equal(next.textContent,'Finish')
  assert.equal(prev.disabled,false)
  next.click()
  await eventually(() => assert.equal(wizard.querySelector('[role=status]').textContent,'Done'))
  assert.equal(current(wizard),undefined)
  assert.equal(wizard.querySelectorAll('li[data-complete]').length,2)
  assert.equal(next.disabled,true)
  prev.click()
  await eventually(() => assert.equal(current(wizard),'Review'))
  assert.equal(wizard.querySelector('[role=status]').textContent,'')
  request.click()
  await eventually(() => assert.equal(form.querySelector('output').textContent,'1'))
  assert.equal(current(controlled),'Details','request cannot mutate a controlled step')
  document.getElementById('accept').click()
  await eventually(() => assert.equal(current(controlled),'Review'))
  assert.equal(submissions,0)
  await dispose()
  await win.happyDOM.close()
} else {
  for (const framework of Object.keys(fixtures)) test(`Ready Steps in ${framework}: labeled list, one current step, completion and controlled navigation`, {timeout:60000}, async () => {
    const folder = await mkdtemp(join(repo,'node_modules/.ready-steps-'))
    try {
      const ext = { react:'tsx', solid:'tsx', vue:'vue', svelte:'svelte' }[framework]
      const fixture = './Fixture.'+ext
      await writeFile(join(folder,fixture), fixtures[framework])
      const entries = {
        react:`import {createRoot} from 'react-dom/client';import {createElement} from 'react';import App from '${fixture}';const app=createRoot(document.getElementById('app'));app.render(createElement(App));export const dispose=()=>app.unmount()`,
        solid:`import {render} from 'solid-js/web';import App from '${fixture}';export const dispose=render(()=>App(),document.getElementById('app'))`,
        vue:`import {createApp} from 'vue';import App from '${fixture}';const app=createApp(App);app.mount('#app');export const dispose=()=>app.unmount()`,
        svelte:`import {mount,unmount} from 'svelte';import App from '${fixture}';const app=mount(App,{target:document.getElementById('app')});export const dispose=()=>unmount(app)`,
      }
      const entry = join(folder,'entry.mjs')
      await writeFile(entry,entries[framework]+`\nexport { prepareSteps, validateStepsIndex } from '${ready}/Steps'\n`)
      const plugin = await ({
        react:async()=> (await import('@vitejs/plugin-react')).default(),
        solid:async()=> (await import('vite-plugin-solid')).default(),
        vue:async()=> (await import('@vitejs/plugin-vue')).default(),
        svelte:async()=> (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false}),
      }[framework]())
      const out = join(folder,'out')
      await build({root:repo,configFile:false,logLevel:'error',publicDir:false,plugins:[plugin],
        build:{outDir:out,minify:false,lib:{entry,formats:['es'],fileName:()=> 'entry.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}}})
      execFileSync(process.execPath,[file,'--dom',join(out,'entry.mjs')],{cwd:repo,encoding:'utf8',timeout:12000,stdio:'inherit'})
    } finally { await rm(folder,{recursive:true,force:true}) }
  })
}
