import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')

const app = (accept, acceptHandler, rejectHandler, set) => `
  <form id="settings">
    <Slider label="Brightness" name="brightness" min={10} max={30} step={5} defaultValue={15} />
    <Slider label="Blocked" name="blocked" disabled defaultValue={10} />
    <Slider label="Fixed" name="fixed" value={40} ${rejectHandler} />
    <Slider label="Managed" name="managed" ${accept} ${acceptHandler} />
    <button id="set" type="button" ${set}>Set externally</button>
    <output id="proposed">{proposed}</output>
  </form>`;
const widgets = markup => markup.replaceAll(/(min|max|step|defaultValue|value)=\{([0-9]+)\}/g, ':$1="$2"');
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Slider} from '${ready}/react/Slider';
    function App(){const [value,setValue]=useState(20);const [proposed,setProposed]=useState(null);return (${app('value={value}','onValueChange={setValue}','onValueChange={setProposed}',"onClick={()=>setValue(60)}")})}
    createRoot(document.getElementById('app')).render(<App/>);`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {Slider} from '${ready}/solid/Slider';
    function App(){const [value,setValue]=createSignal(20);const [proposed,setProposed]=createSignal(null);return (${app('value={value()}','onValueChange={setValue}','onValueChange={setProposed}',"onClick={()=>setValue(60)}").replace('{proposed}','{proposed()}')})}
    render(()=> <App/>,document.getElementById('app'));`,
  vue: `<script setup>import {ref} from 'vue';import Slider from '${ready}/vue/Slider.vue';
    const value=ref(20);const proposed=ref(null);</script><template>${widgets(app('v-model:value="value"','','@value-change="proposed=$event"','@click="value=60"')).replace('{proposed}','{{ proposed }}')}</template>`,
  svelte: `<script>import Slider from '${ready}/svelte/Slider.svelte';let value=$state(20);let proposed=$state(null);</script>${app('{value}','onValueChange={(next)=>value=next}','onValueChange={(next)=>proposed=next}',"onclick={()=>value=60}")}`,
}
if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window()
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|KeyboardEvent|MouseEvent|PointerEvent|FocusEvent|FormData|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  const { resolveSlider } = await import(pathToFileURL(process.argv[3]))
    const input = { label: 'Volume', min: 0.1, max: 0.8, step: 0.1 }
    assert.deepEqual(resolveSlider(input).defaultValue,[0.1])
    assert.deepEqual(resolveSlider({...input,value:0.5}).value,[0.5])
    for (const extra of [{label:' '},{now: NaN,value:NaN},{value:[0.5]},{value:1},{defaultValue:0},{max:0},{step:0},{step:Infinity},{step:2}])
      assert.throws(()=>resolveSlider({...input,...extra}),/Ready Slider/)

  const eventually = async (read) => {
    for (let i = 0; i < 80; i++) {
      try { return read() } catch (error) {
        if (i === 79) throw error
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
  }

  const named = label => [...document.querySelectorAll('[role=slider]')].find(node =>
    document.getElementById(node.getAttribute('aria-labelledby'))?.textContent.trim() === label)
  const data = () => Object.fromEntries(new FormData(document.querySelector('#settings')))
  const find = await eventually(() => {
    const nodes = ['Brightness','Blocked','Fixed','Managed'].map(named)
    assert.ok(nodes.every(Boolean), document.body.innerHTML)
    return nodes
  })
  const [brightness, blocked, fixed, managed] = find
  const ids = [...document.querySelectorAll('#settings [id]')].map(n=>n.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(brightness.getAttribute('aria-valuemin'),'10')
  assert.equal(brightness.getAttribute('aria-valuemax'),'30')
  assert.equal(brightness.getAttribute('aria-valuenow'),'15')
  assert.equal(brightness.getAttribute('tabindex'),'0')
  assert.equal(blocked.getAttribute('aria-disabled'),'true')
  assert.equal(blocked.hasAttribute('tabindex'),false)
  assert.equal(blocked.querySelector('input').disabled,true)
  assert.deepEqual(data(),{brightness:'15',fixed:'40',managed:'20'})
  const press = (thumb,key) => {
    thumb.focus()
    thumb.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))
  }
  press(brightness,'ArrowRight')
  await eventually(() => assert.equal(brightness.getAttribute('aria-valuenow'),'20'))
  await eventually(() => assert.equal(data().brightness,'20'))
  press(brightness,'End')
  await eventually(() => assert.equal(data().brightness,'30'))
  press(brightness,'Home')
  await eventually(() => assert.equal(data().brightness,'10'))
  await eventually(() => assert.equal(brightness.getAttribute('aria-valuenow'),'10'))
  press(brightness,'ArrowLeft')
  assert.equal(brightness.getAttribute('aria-valuenow'),'10')
  press(blocked,'ArrowRight')
  assert.equal(blocked.getAttribute('aria-valuenow'),'10')
  press(fixed,'ArrowRight')
  await eventually(() => assert.equal(document.querySelector('#proposed').textContent,'41'))
  assert.equal(fixed.getAttribute('aria-valuenow'),'40')
  assert.equal(data().fixed,'40')
  press(managed,'ArrowRight')
  await eventually(() => assert.equal(managed.getAttribute('aria-valuenow'),'21'))
  await eventually(() => assert.equal(data().managed,'21'))
  document.querySelector('#set').click()
  await eventually(() => assert.equal(managed.getAttribute('aria-valuenow'),'60'))
  await eventually(() => assert.equal(data().managed,'60'))
  await dom.happyDOM.close()
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Slider keyboard, labeling, disabled submission and controlled state in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-slider-'))
      try {
        let entry = join(dir, 'entry.tsx')
        let source = fixture
        let plugin
        if (framework === 'react') plugin = (await import('@vitejs/plugin-react')).default()
        if (framework === 'solid') plugin = (await import('vite-plugin-solid')).default()
        if (framework === 'vue' || framework === 'svelte') {
          await writeFile(join(dir, `Fixture.${framework}`), fixture)
          entry = join(dir, 'entry.js')
          if (framework === 'vue') {
            plugin = (await import('@vitejs/plugin-vue')).default()
            source = "import {createApp} from 'vue';import App from './Fixture.vue';createApp(App).mount('#app')"
          } else {
            plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
            source = "import {mount} from 'svelte';import App from './Fixture.svelte';mount(App,{target:document.getElementById('app')})"
          }
        }
        await writeFile(entry, source + `\nexport { resolveSlider } from '${ready}/Slider';`)
        await build({ root, configFile:false, logLevel:'error', plugins:[plugin], build:{ outDir:join(dir,'out'), lib:{ entry, formats:['es'], fileName:()=> 'slider.mjs' }, rollupOptions:{output:{inlineDynamicImports:true}} } })
        const bundle = join(dir,'out/slider.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle], { timeout:12000, stdio:'inherit' })
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
