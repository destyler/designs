import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Toggle} from '${ready}/react/Toggle';
    function App(){const [pressed,setPressed]=useState(false),[events,setEvents]=useState([]);const record=value=>setEvents(e=>[...e,value]);
      return <form onSubmit={event=>{event.preventDefault();record('submit')}}><Toggle label="Bold" defaultPressed onPressedChange={record}/><Toggle label="Fixed" pressed={pressed} onPressedChange={record}/><Toggle label="Disabled" disabled onPressedChange={record}/><button type="button" id="external" onClick={()=>setPressed(p=>!p)}>Update parent</button><output>{JSON.stringify(events)}</output></form>}
    createRoot(document.getElementById('app')).render(<App/>);`,
  solid: `import {render} from 'solid-js/web';import {createSignal} from 'solid-js';import {Toggle} from '${ready}/solid/Toggle';
    function App(){const [pressed,setPressed]=createSignal(false),[events,setEvents]=createSignal([]);const record=value=>setEvents(e=>[...e,value]);
      return <form onSubmit={event=>{event.preventDefault();record('submit')}}><Toggle label="Bold" defaultPressed onPressedChange={record}/><Toggle label="Fixed" pressed={pressed()} onPressedChange={record}/><Toggle label="Disabled" disabled onPressedChange={record}/><button type="button" id="external" onClick={()=>setPressed(p=>!p)}>Update parent</button><output>{JSON.stringify(events())}</output></form>}
    render(()=> <App/>,document.getElementById('app'));`,
  vue: `<script setup>import {ref} from 'vue';import Toggle from '${ready}/vue/Toggle.vue';const pressed=ref(false),events=ref([]),bound=ref(false);const record=value=>events.value.push(value)</script>
    <template><form @submit.prevent="record('submit')"><Toggle label="Bold" default-pressed @pressed-change="record"/><Toggle label="Fixed" :pressed="pressed" @pressed-change="record"/><Toggle label="Disabled" disabled @pressed-change="record"/><Toggle label="Model" v-model:pressed="bound"/><button type="button" id="external" @click="pressed=!pressed">Update parent</button><output>{{JSON.stringify(events)}}</output></form></template>`,
  svelte: `<script>import Toggle from '${ready}/svelte/Toggle.svelte';let pressed=$state(false),events=$state([]);const record=value=>events=[...events,value];</script>
    <form onsubmit={event=>{event.preventDefault();record('submit')}}><Toggle label="Bold" defaultPressed onPressedChange={record}/><Toggle label="Fixed" {pressed} onPressedChange={record}/><Toggle label="Disabled" disabled onPressedChange={record}/><button type="button" id="external" onclick={()=>pressed=!pressed}>Update parent</button><output>{JSON.stringify(events)}</output></form>`,
}

async function eventually(check) {
  const limit = Date.now() + 2200
  for (;;) {
    try { check(); return } catch (error) {
      if (Date.now() > limit) throw error
      await new Promise(resolve => setTimeout(resolve, 15))
    }
  }
}

async function verify(document) {
  const button = label => [...document.querySelectorAll('button[data-scope="toggle"][data-part="root"]')].find(node => node.textContent.trim() === label)
  await eventually(() => assert.ok(button('Bold')))
  const bold = button('Bold'), fixed = button('Fixed'), disabled = button('Disabled')
  const pressed = (node, value) => {
    assert.equal(node.getAttribute('aria-pressed'), String(value))
    assert.equal(node.getAttribute('data-state'), value ? 'on' : 'off')
  }
  const events = expected => assert.equal(document.querySelector('output').textContent, JSON.stringify(expected))
  for (const node of [bold, fixed, disabled]) assert.equal(node.type, 'button')
  assert.equal(disabled.disabled, true)
  pressed(bold, true)
  pressed(fixed, false)
  pressed(disabled, false)
  events([])
  bold.click()
  await eventually(() => { pressed(bold, false); events([false]) })
  bold.click()
  await eventually(() => { pressed(bold, true); events([false, true]) })
  disabled.click()
  pressed(disabled, false)
  events([false, true])
  fixed.click()
  await eventually(() => { pressed(fixed, false); events([false, true, true]) })
  document.querySelector('#external').click()
  await eventually(() => { pressed(fixed, true); events([false, true, true]) })
  fixed.click()
  await eventually(() => { pressed(fixed, true); events([false, true, true, false]) })
  assert.equal(bold.textContent.trim(), 'Bold', 'the label is stable between states')
  const model = button('Model')
  if (model) {
    model.click()
    await eventually(() => pressed(model, true))
    model.click()
    await eventually(() => pressed(model, false))
  }
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const window = new Window({url:'http://localhost/'})
  for (const key of Object.getOwnPropertyNames(window)) {
    if (/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|MutationObserver|navigator)$/.test(key)) {
      Object.defineProperty(globalThis, key, {configurable:true,writable:true,value:window[key]})
    }
  }
  globalThis.window = window
  globalThis.document = window.document
  document.body.innerHTML = '<main id="app"></main>'
  try {
    await import(pathToFileURL(process.argv[3]))
    await verify(document)
  } finally { await window.happyDOM.close() }
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Toggle preserves native semantics and state in ${framework}`, {timeout:60000}, async () => {
      const folder = await mkdtemp(join(root, 'node_modules/.ready-toggle-'))
      try {
        let entry, plugin
        if (framework === 'vue' || framework === 'svelte') {
          await writeFile(join(folder,`Fixture.${framework}`), fixture)
          entry = join(folder, 'entry.js')
          await writeFile(entry, framework === 'vue'
            ? `import {createApp} from 'vue';import App from './Fixture.vue';createApp(App).mount('#app')`
            : `import {mount} from 'svelte';import App from './Fixture.svelte';mount(App,{target:document.getElementById('app')})`)
          plugin = framework === 'vue' ? (await import('@vitejs/plugin-vue')).default() : (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
        } else {
          entry = join(folder, 'entry.tsx')
          await writeFile(entry, fixture)
          plugin = framework === 'react' ? (await import('@vitejs/plugin-react')).default() : (await import('vite-plugin-solid')).default()
        }
        await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'entry.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}}})
        const bundle = join(folder, 'out/entry.mjs')
        execFileSync(process.execPath, [filename,'--dom',bundle], {cwd:root,timeout:12000,stdio:'inherit'})
        if (process.env.READY_CHROMIUM_PATH) {
          const { chromium } = await import('playwright')
          const browser = await chromium.launch({executablePath:process.env.READY_CHROMIUM_PATH})
          try {
            const page = await browser.newPage()
            const errors = []
            page.on('pageerror', error => errors.push(error.message))
            await page.setContent('<main id="app"></main>')
            await page.addScriptTag({type:'module',content:await readFile(bundle,'utf8')})
            const bold = page.getByRole('button',{name:'Bold',exact:true})
            await bold.waitFor()
            assert.equal(await bold.getAttribute('aria-pressed'), 'true')
            await page.keyboard.press('Tab')
            assert.equal(await bold.evaluate(button => button === document.activeElement), true)
            await page.keyboard.press('Space')
            assert.equal(await bold.getAttribute('aria-pressed'), 'false')
            await page.keyboard.press('Enter')
            assert.equal(await bold.getAttribute('aria-pressed'), 'true')
            assert.equal(await page.locator('output').textContent(), '[false,true]')
            await page.keyboard.press('Tab')
            assert.equal(await page.getByRole('button',{name:'Fixed',exact:true}).evaluate(button=>button===document.activeElement), true)
            await page.keyboard.press('Tab')
            const following = framework === 'vue' ? page.getByRole('button',{name:'Model',exact:true}) : page.locator('#external')
            assert.equal(await following.evaluate(button=>button===document.activeElement), true)
            assert.equal(await page.getByRole('button',{name:'Disabled',exact:true}).isDisabled(), true)
            assert.deepEqual(errors, [])
          } finally { await browser.close() }
        }
      } finally { await rm(folder,{recursive:true,force:true}) }
    })
  }
}
