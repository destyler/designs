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
const initial = '  alpha  '
const fixtures = {
  react: `import {useState} from 'react';import {Clipboard} from '${ready}/react/Clipboard';export default function App(){const [value,setValue]=useState('${initial}');return <form><Clipboard label="Access code" value={value}/><button type="button" id="change" onClick={()=>setValue('beta')}>Change</button><button type="button" id="restore" onClick={()=>setValue('${initial}')}>Restore</button><button type="button" id="blank" onClick={()=>setValue('')}>Blank</button></form>}`,
  solid: `import {createSignal} from 'solid-js';import {Clipboard} from '${ready}/solid/Clipboard';export default function App(){const [value,setValue]=createSignal('${initial}');return <form><Clipboard label="Access code" value={value()}/><button type="button" id="change" onClick={()=>setValue('beta')}>Change</button><button type="button" id="restore" onClick={()=>setValue('${initial}')}>Restore</button><button type="button" id="blank" onClick={()=>setValue('')}>Blank</button></form>}`,
  vue: `<script setup>import {ref} from 'vue';import Clipboard from '${ready}/vue/Clipboard.vue';const value=ref('${initial}')</script><template><form><Clipboard label="Access code" :value="value"/><button type="button" id="change" @click="value='beta'">Change</button><button type="button" id="restore" @click="value='${initial}'">Restore</button><button type="button" id="blank" @click="value=''">Blank</button></form></template>`,
  svelte: `<script>import Clipboard from '${ready}/svelte/Clipboard.svelte';let value=$state('${initial}')</script><form><Clipboard label="Access code" {value}/><button type="button" id="change" onclick={()=>value='beta'}>Change</button><button type="button" id="restore" onclick={()=>value='${initial}'}>Restore</button><button type="button" id="blank" onclick={()=>value=''}>Blank</button></form>`,
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
  const win = new Window({ url:'https://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) if (/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(key)) {
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})
  }
  globalThis.window = win
  globalThis.document = win.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  document.body.innerHTML = '<main id="app"></main>'
  const { dispose, clipboardText } = await import(pathToFileURL(process.argv[3]))
  assert.throws(() => clipboardText({label:'Code',value:'foo\nbar'}),/single-line/)
  assert.throws(() => clipboardText({label:'Code',value:'foo',copyLabel:' '}),/copyLabel/)
  await eventually(() => assert.equal(document.querySelectorAll('input').length,1))
  const root = document.querySelector('.rd-clipboard')
  const input = root.querySelector('input')
  const copy = root.querySelector('button')
  const status = root.querySelector('[role=status]')
  const phase = () => status.textContent
  const phaseIs = text => eventually(() => assert.equal(phase(),text))
  const set = (id, value) => {
    document.getElementById(id).click()
    return eventually(() => assert.equal(input.value,value))
  }
  const attempts = []
  const pending = []
  const clipboard = { writeText(text) { attempts.push(text); return new Promise((resolve,reject)=>pending.push({resolve,reject})) } }
  Object.defineProperty(win.navigator,'clipboard',{configurable:true,value:clipboard})
  assert.equal(copy.type,'button')
  assert.equal(copy.textContent,'Copy')
  assert.equal(input.labels[0].textContent,'Access code')
  assert.equal(input.readOnly,true)
  assert.equal(input.value,initial)
  assert.equal(phase(),'')
  let submissions = 0
  document.querySelector('form').addEventListener('submit', event=>{event.preventDefault();submissions++})

  copy.focus()
  copy.click()
  copy.click()
  await phaseIs('Copying…')
  assert.equal(copy.getAttribute('aria-disabled'),'true')
  assert.equal(document.activeElement === copy,true)
  assert.deepEqual(attempts,[initial])
  pending.shift().resolve()
  await phaseIs('Copied to clipboard')
  assert.equal(copy.getAttribute('aria-disabled'),null)
  await set('change','beta')
  await phaseIs('')

  copy.click()
  await phaseIs('Copying…')
  pending.shift().reject(new Error('write denied'))
  const failure = 'Could not copy. Select the text and copy it manually.'
  await phaseIs(failure)
  assert.equal(document.activeElement === copy,true,'manual fallback does not steal focus')
  input.select()
  assert.equal(input.selectionStart,0)
  assert.equal(input.selectionEnd,'beta'.length)
  Object.defineProperty(win.navigator,'clipboard',{configurable:true,value:undefined})
  copy.click()
  await phaseIs(failure)
  assert.deepEqual(attempts,[initial,'beta'])

  Object.defineProperty(win.navigator,'clipboard',{configurable:true,value:clipboard})
  copy.click()
  await phaseIs('Copying…')
  await set('restore',initial)
  await set('change','beta')
  pending.shift().resolve()
  await phaseIs('')
  assert.deepEqual(attempts,[initial,'beta','beta'],'A→B→A invalidates the earlier pending result')
  await set('blank','')
  assert.equal(copy.disabled,true)
  copy.click()
  assert.equal(attempts.length,3)
  await set('restore',initial)
  copy.click()
  await phaseIs('Copying…')
  await dispose()
  pending.shift().resolve()
  await new Promise(resolve=>setTimeout(resolve,0))
  assert.equal(submissions,0)
  await win.happyDOM.close()
} else {
  for (const framework of Object.keys(fixtures)) test(`Ready Clipboard in ${framework}: exact copy, asynchronous failure, fallback and race handling`, {timeout:60000}, async () => {
    const folder = await mkdtemp(join(repo,'node_modules/.ready-clipboard-'))
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
      await writeFile(entry,entries[framework]+`\nexport { clipboardText } from '${ready}/Clipboard'\n`)
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
