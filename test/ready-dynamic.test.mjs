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
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {Dynamic} from '${ready}/react/Dynamic';
    createRoot(document.getElementById('app')).render(<form onSubmit={e=>{e.preventDefault();window.submits++}}>
      <section id="main"><Dynamic label="Project tags" name="tags" defaultValue={['design']} maxTags={2} maxLength={10} onValueChange={window.record}/></section>
      <section id="disabled"><Dynamic label="Disabled tags" name="disabledTags" defaultValue={['draft']} disabled /></section>
    </form>);`,
  solid: `import {render} from 'solid-js/web';import {Dynamic} from '${ready}/solid/Dynamic';
    render(()=> <form onSubmit={e=>{e.preventDefault();window.submits++}}>
      <section id="main"><Dynamic label="Project tags" name="tags" defaultValue={['design']} maxTags={2} maxLength={10} onValueChange={window.record}/></section>
      <section id="disabled"><Dynamic label="Disabled tags" name="disabledTags" defaultValue={['draft']} disabled /></section>
    </form>,document.getElementById('app'));`,
  vue: `<script setup>import Dynamic from '${ready}/vue/Dynamic.vue';const record=window.record;const submit=()=>window.submits++;</script>
    <template><form @submit.prevent="submit">
      <section id="main"><Dynamic label="Project tags" name="tags" :default-value="['design']" :max-tags="2" :max-length="10" @value-change="record"/></section>
      <section id="disabled"><Dynamic label="Disabled tags" name="disabledTags" :default-value="['draft']" disabled /></section>
    </form></template>`,
  svelte: `<script>import Dynamic from '${ready}/svelte/Dynamic.svelte';const record=window.record;</script>
    <form onsubmit={e=>{e.preventDefault();window.submits++}}>
      <section id="main"><Dynamic label="Project tags" name="tags" defaultValue={['design']} maxTags={2} maxLength={10} onValueChange={record}/></section>
      <section id="disabled"><Dynamic label="Disabled tags" name="disabledTags" defaultValue={['draft']} disabled /></section>
    </form>`,
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window()
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|KeyboardEvent|InputEvent|FocusEvent|FormData|CSS|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  const updates = []
  window.record = tags => updates.push([...tags])
  window.submits = 0
  await import(pathToFileURL(process.argv[3]))
  const eventually = async read => {
    for (let i = 0; i < 80; i++) {
      try { return read() } catch (error) {
        if (i === 79) throw error
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
  }
  const main = await eventually(() => {
    const main = document.querySelector('#main')
    assert.ok(main?.querySelector('[data-part="input"]'), document.body.innerHTML)
    return main
  })
  const input = main.querySelector('[data-part="input"]')
  const clear = main.querySelector('[data-part="clear-trigger"]')
  const add = main.querySelector('.rd-dynamic-add')
  const form = document.querySelector('form')
  const disabled = document.querySelector('#disabled')
  const disabledInput = disabled.querySelector('[data-part="input"]')
  const status = main.querySelector('[role="status"]')
  const rendered = () => [...main.querySelectorAll('[data-part="item-text"]')].map(node => node.textContent)
  const checking = expected => eventually(() => {
    assert.deepEqual(rendered(), expected)
    assert.deepEqual([...new window.FormData(form)],[['tags',JSON.stringify(expected)]])
  })
  assert.equal(input.labels[0].textContent, 'Project tags')
  assert.equal(input.maxLength, 10)
  assert.match(document.getElementById(input.getAttribute('aria-describedby')).textContent, /Limit: 2/)
  assert.notEqual(input.id, disabledInput.id)
  assert.equal(disabledInput.disabled, true)
  assert.equal(disabled.querySelector('[data-part="item-delete-trigger"]').disabled, true)
  await checking(['design'])
  const press = key => input.dispatchEvent(new window.KeyboardEvent('keydown', {bubbles:true,cancelable:true,key}))
  const type = value => {
    input.focus()
    input.value = value
    input.dispatchEvent(new window.InputEvent('input', {bubbles:true,inputType:'insertText',data:value}))
  }
  type('design')
  press('Enter')
  await eventually(() => assert.match(status.textContent, /unique tag/))
  await checking(['design'])
  await eventually(() => assert.equal(input.value, ''))
  type('exceeds-ten')
  press('Enter')
  await checking(['design'])
  await eventually(() => assert.equal(input.value, ''))
  type(' docs ')
  input.dispatchEvent(new window.KeyboardEvent('keydown', {bubbles:true,cancelable:true,key:'Enter',isComposing:true}))
  await checking(['design'])
  press('Enter')
  await checking(['design','docs'])
  await eventually(() => assert.equal(input.value, ''))
  assert.equal(status.textContent.trim(), '')
  assert.deepEqual(updates, [['design','docs']])
  type('extra')
  assert.equal(add.disabled, true)
  press('Enter')
  await checking(['design','docs'])
  type('')
  input.setSelectionRange(0,0)
  press('ArrowLeft')
  await eventually(() => assert.equal(main.querySelector('[data-highlighted][data-part="item-preview"]').dataset.value, 'docs'))
  press('Delete')
  await checking(['design'])
  type('release')
  await eventually(() => assert.equal(add.disabled, false))
  add.click()
  await checking(['design','release'])
  await eventually(() => assert.equal(input.value, ''))
  const remove = main.querySelector('[aria-label="Remove tag design"]')
  assert.equal(remove.type, 'button')
  remove.click()
  await checking(['release'])
  clear.click()
  await checking([])
  await eventually(() => assert.equal(clear.hidden, true))
  assert.equal(window.submits, 0)
  assert.equal(document.activeElement, input)
  assert.deepEqual(updates, [['design','docs'], ['design'], ['design','release'], ['release'], []])
  form.reset()
  await checking(['design'])
  assert.deepEqual(updates.at(-1), ['design'])
  await dom.happyDOM.close()
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Dynamic adds, bounds, removes, and submits tags in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-dynamic-'))
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
        await build({ root, configFile:false, logLevel:'error', plugins:[plugin], build:{ outDir:join(dir,'out'), lib:{ entry, formats:['es'], fileName:()=> 'dynamic.mjs' }, rollupOptions:{output:{inlineDynamicImports:true}} } })
        const bundle = join(dir,'out/dynamic.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle], { timeout:12000, stdio:'inherit' })
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
