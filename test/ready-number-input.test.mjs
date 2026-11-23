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
const shared = `<NumberInput label="Rejected" name="rejected" value="5"/><NumberInput label="Required" name="required" required/><NumberInput label="Read only" name="locked" defaultValue="1" readOnly/><NumberInput label="Disabled" name="disabled" defaultValue="9" disabled/>`
const factories = {
  react: `import {useState} from 'react';import {NumberInput} from '${ready}/react/NumberInput';export default function App(){const [value,setValue]=useState('1000.125'),[error,setError]=useState('Not yet valid');return <form id="test"><NumberInput label="Amount" name="amount" defaultValue="-1.5" min={-3} max={0} step={0.5} description="Use a decimal"/><NumberInput label="Controlled" name="controlled" value={value} step={0.125} error={error} onValueChange={setValue}/>${shared}<button type="button" id="clear-error" onClick={()=>setError('')}>Clear error</button></form>}`,
  solid: `import {createSignal} from 'solid-js';import {NumberInput} from '${ready}/solid/NumberInput';export default function App(){const [value,setValue]=createSignal('1000.125'),[error,setError]=createSignal('Not yet valid');return <form id="test"><NumberInput label="Amount" name="amount" defaultValue="-1.5" min={-3} max={0} step={0.5} description="Use a decimal"/><NumberInput label="Controlled" name="controlled" value={value()} step={0.125} error={error()} onValueChange={setValue}/>${shared}<button type="button" id="clear-error" onClick={()=>setError('')}>Clear error</button></form>}`,
  vue: `<script setup>import {ref} from 'vue';import NumberInput from '${ready}/vue/NumberInput.vue';const value=ref('1000.125'),error=ref('Not yet valid')</script><template><form id="test"><NumberInput label="Amount" name="amount" default-value="-1.5" :min="-3" :max="0" :step="0.5" description="Use a decimal"/><NumberInput label="Controlled" name="controlled" v-model:value="value" :step="0.125" :error="error"/>${shared.replaceAll('defaultValue','default-value').replaceAll('readOnly','read-only')}<button type="button" id="clear-error" @click="error=''">Clear error</button></form></template>`,
  svelte: `<script>import NumberInput from '${ready}/svelte/NumberInput.svelte';let value=$state('1000.125'),error=$state('Not yet valid')</script><form id="test"><NumberInput label="Amount" name="amount" defaultValue="-1.5" min={-3} max={0} step={0.5} description="Use a decimal"/><NumberInput label="Controlled" name="controlled" {value} step={0.125} {error} onValueChange={v=>value=v}/>${shared}<button type="button" id="clear-error" onclick={()=>error=''}>Clear error</button></form>`,
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
  const { dispose } = await import(pathToFileURL(process.argv[3]))
  await eventually(() => assert.equal(document.querySelectorAll('[role=spinbutton]').length,6))
  const form = document.getElementById('test')
  const field = name => document.querySelector(`input[name=${name}]`)
  const amount = field('amount'), controlled = field('controlled')
  assert.equal(amount.value,'-1.5')
  assert.equal(controlled.value,'1000.125')
  assert.equal(amount.labels[0].textContent,'Amount')
  assert.equal(document.getElementById(amount.getAttribute('aria-describedby')).textContent,'Use a decimal')
  assert.equal(document.getElementById(controlled.getAttribute('aria-describedby')).textContent,'Not yet valid')
  await eventually(() => assert.equal(controlled.validity.customError,true))
  assert.equal(controlled.getAttribute('aria-invalid'),'true')
  assert.equal(amount.getAttribute('aria-valuemin'),'-3')
  assert.equal(amount.getAttribute('aria-valuemax'),'0')
  assert.equal(amount.validity.patternMismatch,false)
  assert.equal(field('required').validity.valueMissing,true)
  assert.equal(field('locked').readOnly,true)
  assert.equal(field('disabled').disabled,true)
  const data = () => new win.FormData(form)
  assert.equal(data().get('disabled'),null)
  assert.equal(data().get('locked'),'1')
  assert.equal(data().get('controlled'),'1000.125')
  assert.equal(data().get('amount'),'-1.5')
  const buttons = [...document.querySelectorAll('button[aria-controls]')].filter(button=>button.getAttribute('aria-controls')===amount.id)
  assert.equal(buttons.length,2)
  for (const button of buttons) {
    assert.equal(button.type,'button')
    assert.ok(button.getAttribute('aria-label'))
  }
  document.getElementById('clear-error').click()
  await eventually(() => assert.equal(controlled.validity.customError,false))
  assert.equal(controlled.getAttribute('aria-describedby'),null)
  const key = (input, name) => {
    input.focus()
    input.dispatchEvent(new win.KeyboardEvent('keydown',{key:name,bubbles:true,cancelable:true}))
  }
  key(amount,'ArrowUp')
  await eventually(() => assert.equal(data().get('amount'),'-1'))
  key(amount,'End')
  await eventually(() => assert.equal(data().get('amount'),'0'))
  assert.equal(buttons[1].disabled,true)
  buttons[0].dispatchEvent(new win.PointerEvent('pointerdown',{button:0,pointerType:'mouse',bubbles:true,cancelable:true}))
  buttons[0].dispatchEvent(new win.PointerEvent('pointerup',{button:0,pointerType:'mouse',bubbles:true,cancelable:true}))
  await eventually(() => assert.equal(data().get('amount'),'-0.5'))
  key(controlled,'ArrowUp')
  await eventually(() => assert.equal(data().get('controlled'),'1000.25'))
  controlled.value = '12.375'
  controlled.dispatchEvent(new win.InputEvent('input',{bubbles:true,cancelable:true}))
  await eventually(() => assert.equal(controlled.getAttribute('aria-valuenow'),'12.375'))
  assert.equal(data().get('controlled'),'12.375')
  const rejected = field('rejected')
  rejected.focus()
  rejected.value = '6'
  rejected.dispatchEvent(new win.InputEvent('input',{bubbles:true,cancelable:true}))
  await eventually(() => assert.equal(data().get('rejected'),'5'))
  key(field('locked'),'ArrowUp')
  assert.equal(data().get('locked'),'1')
  form.reset()
  await eventually(() => {
    assert.equal(data().get('amount'),'-1.5')
    assert.equal(data().get('controlled'),'1000.125')
  })
  await dispose()
  await win.happyDOM.close()
} else {
  for (const framework of Object.keys(factories)) test(`Ready NumberInput in ${framework}: labels, signed decimals, keyboard state and native forms`, {timeout:60000}, async () => {
    const folder = await mkdtemp(join(repo,'node_modules/.ready-number-input-'))
    try {
      const ext = { react:'tsx', solid:'tsx', vue:'vue', svelte:'svelte' }[framework]
      const fixture = './Fixture.'+ext
      await writeFile(join(folder,fixture), factories[framework])
      const entries = {
        react:`import {createRoot} from 'react-dom/client';import {createElement} from 'react';import App from '${fixture}';const app=createRoot(document.getElementById('app'));app.render(createElement(App));export const dispose=()=>app.unmount()`,
        solid:`import {render} from 'solid-js/web';import App from '${fixture}';export const dispose=render(()=>App(),document.getElementById('app'))`,
        vue:`import {createApp} from 'vue';import App from '${fixture}';const app=createApp(App);app.mount('#app');export const dispose=()=>app.unmount()`,
        svelte:`import {mount,unmount} from 'svelte';import App from '${fixture}';const app=mount(App,{target:document.getElementById('app')});export const dispose=()=>unmount(app)`,
      }
      const entry = join(folder,'entry.mjs')
      await writeFile(entry,entries[framework])
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
