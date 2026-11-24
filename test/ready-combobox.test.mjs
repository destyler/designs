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
const data = `const options = [{value:'apple',label:'Apple'},{value:'disabled',label:'Berry withheld',disabled:true},{value:'berry',label:'Blueberry'},{value:'pear',label:'Pear'}]`
const fixtures = {
  react: `import {useState} from 'react';import {Combobox} from '${ready}/react/Combobox';${data};export default function App(){const [request,setRequest]=useState('');return <><Combobox label="Fruit" options={options} description="Choose one" emptyMessage="Nothing fits"/><Combobox label="Controlled" options={options} value="apple" onValueChange={setRequest}/><Combobox label="Disabled" options={options} defaultValue="pear" disabled/><output>{request}</output></>}`,
  solid: `import {createSignal} from 'solid-js';import {Combobox} from '${ready}/solid/Combobox';${data};export default function App(){const [request,setRequest]=createSignal('');return <><Combobox label="Fruit" options={options} description="Choose one" emptyMessage="Nothing fits"/><Combobox label="Controlled" options={options} value="apple" onValueChange={setRequest}/><Combobox label="Disabled" options={options} defaultValue="pear" disabled/><output>{request()}</output></>}`,
  vue: `<script setup>import {ref} from 'vue';import Combobox from '${ready}/vue/Combobox.vue';${data};const request=ref('')</script><template><Combobox label="Fruit" :options="options" description="Choose one" empty-message="Nothing fits"/><Combobox label="Controlled" :options="options" value="apple" @value-change="request=$event"/><Combobox label="Disabled" :options="options" default-value="pear" disabled/><output>{{request}}</output></template>`,
  svelte: `<script>import Combobox from '${ready}/svelte/Combobox.svelte';${data};let request=$state('')</script><Combobox label="Fruit" {options} description="Choose one" emptyMessage="Nothing fits"/><Combobox label="Controlled" {options} value="apple" onValueChange={v=>request=v}/><Combobox label="Disabled" {options} defaultValue="pear" disabled/><output>{request}</output>`,
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
  const { dispose, comboboxOptions } = await import(pathToFileURL(process.argv[3]))
  assert.throws(() => comboboxOptions([{value:'a',label:'A'},{value:'a',label:'B'}]),/unique/)
  assert.throws(() => comboboxOptions([{value:'a',label:'  '}]),/non-whitespace/)
  await eventually(() => assert.equal(document.querySelectorAll('[role=combobox]').length,3))
  const [input, controlled, disabled] = document.querySelectorAll('[role=combobox]')
  assert.equal(input.labels[0].textContent,'Fruit')
  assert.equal(document.getElementById(input.getAttribute('aria-describedby')).textContent,'Choose one')
  assert.equal(controlled.value,'Apple')
  assert.equal(disabled.disabled,true)
  assert.equal(disabled.value,'Pear')
  const list = field => document.getElementById(field.getAttribute('aria-controls'))
  assert.equal(list(input).getAttribute('role'),'listbox')
  const key = (field, key) => field.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))
  const type = (field, text) => {
    Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype,'value').set.call(field,text)
    field.dispatchEvent(new win.InputEvent('input',{data:text,inputType:'insertText',bubbles:true,cancelable:true}))
  }
  const expanded = field => field.getAttribute('aria-expanded')
  const optionValues = field => [...list(field).querySelectorAll('[role=option]')].map(el=>el.dataset.value)
  const active = field => document.getElementById(field.getAttribute('aria-activedescendant'))?.getAttribute('data-value')
  input.focus()
  type(input,'BErrY')
  await eventually(() => {
    assert.equal(expanded(input),'true')
    assert.deepEqual(optionValues(input),['disabled','berry'])
  })
  key(input,'ArrowDown')
  await eventually(() => assert.equal(active(input),'berry','disabled result is skipped'))
  key(input,'Enter')
  await eventually(() => {
    assert.equal(input.value,'Blueberry')
    assert.equal(expanded(input),'false')
  })
  type(input,'berry')
  await eventually(() => assert.deepEqual(optionValues(input),['disabled','berry']))
  key(input,'ArrowDown')
  await eventually(() => assert.equal(active(input),'berry'))
  type(input,'xyz')
  await eventually(() => assert.equal(input.closest('.rd-combobox').querySelector('[role=status]')?.textContent,'Nothing fits'))
  assert.equal(optionValues(input).length,0)
  assert.equal(input.getAttribute('aria-activedescendant'),null,'filtering cannot leave a stale active option')
  assert.equal(input.closest('.rd-combobox').querySelector('[role=status]').getAttribute('aria-live'),'polite')
  // The locked primitive installs the dismissable layer on the next animation frame.
  await new Promise(resolve => win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)))
  key(input,'Escape')
  await eventually(() => {
    assert.equal(expanded(input),'false')
    assert.equal(input.value,'Blueberry','cancel restores committed selection')
  })
  const clear = input.closest('.rd-combobox').querySelector('[data-part=clear-trigger]')
  assert.equal(clear.getAttribute('aria-label'),'Clear selection')
  assert.equal(clear.tabIndex,0)
  clear.click()
  await eventually(() => assert.equal(input.value,''))
  controlled.focus()
  type(controlled,'pea')
  await eventually(() => assert.deepEqual(optionValues(controlled),['pear']))
  key(controlled,'ArrowDown')
  await eventually(() => assert.equal(active(controlled),'pear'))
  key(controlled,'Enter')
  await eventually(() => {
    assert.equal(document.querySelector('output').textContent,'pear')
    assert.equal(expanded(controlled),'false')
    assert.equal(controlled.value,'Apple','rejected selection leaves controlled label')
  })
  await dispose()
  await win.happyDOM.close()
} else {
  for (const framework of Object.keys(fixtures)) test(`Ready Combobox in ${framework}: search, keyboard, cancel, clear and controlled selection`, {timeout:60000}, async () => {
    const folder = await mkdtemp(join(repo,'node_modules/.ready-combobox-'))
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
      await writeFile(entry,entries[framework]+`\nexport { comboboxOptions } from '${ready}/Combobox'\n`)
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
