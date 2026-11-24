import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { resolveSplitter } from '../packages/ready/Splitter.ts'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')
const selector = id => `#${id} [role=separator]`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {Splitter} from '${ready}/react/Splitter';
    createRoot(document.getElementById('app')).render(<>
      <form id="main" onSubmit={event=>{event.preventDefault();window.submitCount++}}>
        <Splitter label="Files" defaultSize={40} minSize={20} maxSize={65} step={5}
          first={<a href="#workspace" id="first">Workspace</a>} second={<span id="second">Editor</span>}
          onSizeChange={size=>window.changes.push(size)} />
      </form>
      <div id="vertical"><Splitter label="Timeline" orientation="vertical" /></div>
      <div id="disabled"><Splitter label="Disabled pane" disabled onSizeChange={size=>window.changes.push(size)} /></div>
    </>);`,
  solid: `import {render} from 'solid-js/web';import {Splitter} from '${ready}/solid/Splitter';
    render(()=> <>
      <form id="main" onSubmit={event=>{event.preventDefault();window.submitCount++}}>
        <Splitter label="Files" defaultSize={40} minSize={20} maxSize={65} step={5}
          first={<a href="#workspace" id="first">Workspace</a>} second={<span id="second">Editor</span>}
          onSizeChange={size=>window.changes.push(size)} />
      </form>
      <div id="vertical"><Splitter label="Timeline" orientation="vertical" /></div>
      <div id="disabled"><Splitter label="Disabled pane" disabled onSizeChange={size=>window.changes.push(size)} /></div>
    </>,document.getElementById('app'));`,
  vue: `<script setup>
    import Splitter from '${ready}/vue/Splitter.vue';
    const changed=size=>window.changes.push(size);
    const submit=()=>window.submitCount++;
  </script>
  <template>
    <form id="main" @submit.prevent="submit">
      <Splitter label="Files" :default-size="40" :min-size="20" :max-size="65" :step="5" @size-change="changed">
        <template #first><a href="#workspace" id="first">Workspace</a></template>
        <template #second><span id="second">Editor</span></template>
      </Splitter>
    </form>
    <div id="vertical"><Splitter label="Timeline" orientation="vertical" /></div>
    <div id="disabled"><Splitter label="Disabled pane" disabled @size-change="changed" /></div>
  </template>`,
  svelte: `<script>import Splitter from '${ready}/svelte/Splitter.svelte';
    const changed=size=>window.changes.push(size);
  </script>
  <form id="main" onsubmit={event=>{event.preventDefault();window.submitCount++}}>
    <Splitter label="Files" defaultSize={40} minSize={20} maxSize={65} step={5} onSizeChange={changed}>
      {#snippet first()}<a href="#workspace" id="first">Workspace</a>{/snippet}
      {#snippet second()}<span id="second">Editor</span>{/snippet}
    </Splitter>
  </form>
  <div id="vertical"><Splitter label="Timeline" orientation="vertical" /></div>
  <div id="disabled"><Splitter label="Disabled pane" disabled onSizeChange={changed} /></div>`,
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window()
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|KeyboardEvent|PointerEvent|HTMLElement|CSS|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  window.changes = []
  window.submitCount = 0
  await import(pathToFileURL(process.argv[3]))
  const eventually = async read => {
    for (let i = 0; i < 80; i++) {
      try { return read() } catch (error) {
        if (i === 79) throw error
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
  }
  const [handle, vertical, disabled] = await eventually(() => {
    const nodes = ['main', 'vertical', 'disabled'].map(id => document.querySelector(selector(id)))
    assert.ok(nodes.every(Boolean), document.body.innerHTML)
    return nodes
  })
  assert.equal(handle.getAttribute('data-part'), 'resize-trigger')
  assert.equal(handle.getAttribute('aria-label'), 'Files')
  assert.equal(handle.getAttribute('aria-orientation'), 'vertical')
  assert.equal(vertical.getAttribute('aria-orientation'), 'horizontal')
  assert.equal(handle.getAttribute('aria-valuemin'), '20')
  assert.equal(handle.getAttribute('aria-valuemax'), '65')
  assert.equal(handle.tabIndex, 0)
  assert.equal(disabled.tabIndex, -1)
  assert.equal(disabled.getAttribute('aria-disabled'), 'true')
  assert.equal(handle.type, 'button')
  const controls = trigger => trigger.getAttribute('aria-controls').split(' ').map(id => document.getElementById(id))
  const [first, second] = controls(handle)
  assert.ok(controls(vertical).every(panel => panel !== first && panel !== second))
  const child = document.getElementById('first')
  assert.equal(child.parentElement, first)
  assert.equal(document.getElementById('second').parentElement, second)
  const value = (trigger, now) => assert.equal(trigger.getAttribute('aria-valuenow'), String(now))
  const layout = size => {
    assert.equal(first.style.flexGrow, String(size))
    assert.equal(second.style.flexGrow, String(100 - size))
  }
  value(handle,40)
  layout(40)
  const press = (trigger, key) => trigger.dispatchEvent(new window.KeyboardEvent('keydown', {bubbles:true,cancelable:true,key}))
  // Pointer hovering must not steal the state machine's subsequent keyboard focus.
  handle.dispatchEvent(new window.PointerEvent('pointerover', {bubbles:true, pointerType:'mouse'}))
  handle.focus()
  assert.equal(document.activeElement, handle)
  const resize = async (key, size) => {
    press(handle,key)
    await eventually(() => { value(handle,size); layout(size) })
    assert.equal(document.activeElement, handle)
    assert.equal(document.getElementById('first'), child)
  }
  await resize('ArrowRight',45)
  await resize('Home',20)
  await resize('ArrowLeft',20)
  await resize('End',65)
  await resize('ArrowRight',65)
  await resize('Enter',20)
  assert.deepEqual(window.changes,[45,20,65,20])
  handle.click()
  assert.equal(window.submitCount,0)
  vertical.focus()
  press(vertical,'ArrowDown')
  await eventually(() => value(vertical,51))
  press(vertical,'ArrowUp')
  await eventually(() => value(vertical,50))
  disabled.focus()
  press(disabled,'ArrowRight')
  press(disabled,'End')
  await new Promise(resolve => setTimeout(resolve, 30))
  value(disabled,50)
  assert.deepEqual(window.changes,[45,20,65,20])
  // Happy DOM has no real geometry or pointer capture. Stub geometry only and exercise
  // the real primitive's document-level pointer movement and boundary calculations.
  const pointer = (type, x, button = 0) => new window.PointerEvent(type, {
    bubbles:true, cancelable:true, pointerId:1, isPrimary:true, pointerType:'mouse', button, clientX:x, clientY:20,
  })
  const primitiveRoot = handle.parentElement
  Object.defineProperty(primitiveRoot,'offsetWidth',{value:400})
  handle.setPointerCapture = () => {}
  handle.hasPointerCapture = () => false
  handle.dispatchEvent(pointer('pointerdown',100))
  document.dispatchEvent(pointer('pointermove',180,-1))
  await eventually(() => { value(handle,40); layout(40) })
  document.dispatchEvent(pointer('pointermove',440,-1))
  await eventually(() => { value(handle,65); layout(65) })
  document.dispatchEvent(pointer('pointerup',440))
  assert.deepEqual(window.changes,[45,20,65,20,40,65])
  await dom.happyDOM.close()
} else {
  test('Ready Splitter validates percentage configuration and complementary limits', () => {
    const defaultLayout = resolveSplitter({label:'Navigation'})
    assert.deepEqual(defaultLayout.defaultSize,[{id:'first',size:50,minSize:15,maxSize:85},{id:'second',size:50,minSize:15,maxSize:85}])
    const restricted = resolveSplitter({label:'Navigation',minSize:60,maxSize:80})
    assert.deepEqual(restricted.defaultSize,[{id:'first',size:60,minSize:60,maxSize:80},{id:'second',size:40,minSize:20,maxSize:40}])
    for (const invalid of [{label:' '},{minSize:0},{maxSize:100},{minSize:60,maxSize:40},{maxSize:Infinity},{defaultSize:90},{defaultSize:NaN},{step:0},{step:80},{orientation:'left'}]) {
      assert.throws(() => resolveSplitter({label:'Navigation',...invalid}), /Ready Splitter:/)
    }
  })
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Splitter resizes two bounded panes by keyboard in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-splitter-'))
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
        await writeFile(entry, source)
        await build({ root, configFile:false, logLevel:'error', plugins:[plugin], build:{ outDir:join(dir,'out'), lib:{ entry, formats:['es'], fileName:()=> 'splitter.mjs' }, rollupOptions:{output:{inlineDynamicImports:true}} } })
        const bundle = join(dir,'out/splitter.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle], { timeout:12000, stdio:'inherit' })
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
