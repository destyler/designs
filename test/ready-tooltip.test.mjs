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
const markup = `<form id="test"><button id="outside" type="button">Outside</button><Tooltip trigger="Details" text="Additional context"/></form>`
const fixtures = {
  react: `import {Tooltip} from '${ready}/react/Tooltip'; export default function App(){return ${markup}}`,
  solid: `import {Tooltip} from '${ready}/solid/Tooltip'; export default function App(){return ${markup}}`,
  vue: `<script setup>import Tooltip from '${ready}/vue/Tooltip.vue'</script><template>${markup}</template>`,
  svelte: `<script>import Tooltip from '${ready}/svelte/Tooltip.svelte'</script>${markup}`,
}

const sleep = ms => new Promise(resolve => setTimeout(resolve,ms))
const eventually = async check => {
  const deadline = Date.now() + 2500
  for (;;) {
    try { check(); return } catch (error) {
      if (Date.now() >= deadline) throw error
      await sleep(15)
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
  const { dispose, tooltipText } = await import(pathToFileURL(process.argv[3]))
  assert.throws(() => tooltipText({trigger:'',text:'Help'}),/trigger/)
  assert.throws(() => tooltipText({trigger:'Name',text:'  '}),/text/)
  await eventually(() => assert.equal(document.querySelectorAll('[role=tooltip]').length,1))
  const trigger = document.querySelector('[data-part=trigger]'), content = document.querySelector('[role=tooltip]')
  const outside = document.getElementById('outside')
  assert.equal(trigger.type,'button')
  assert.equal(trigger.textContent,'Details')
  assert.equal(content.textContent,'Additional context')
  assert.equal(content.querySelectorAll('a,button,input,[tabindex]').length,0)
  assert.equal(content.getAttribute('tabindex'),null)
  const shown = () => content.hidden === false
  assert.equal(shown(),false)
  // Happy DOM has no native keyboard Tab navigation or focus-visible modality.
  // Supply selector result only; the component still observes the actual DOM focus event.
  const originalMatches = trigger.matches.bind(trigger)
  let keyboard = false
  trigger.matches = selector => selector === ':focus-visible' ? keyboard : originalMatches(selector)
  const visible = async () => {
    await eventually(() => assert.equal(shown(),true))
    assert.ok(content.id)
    assert.equal(trigger.getAttribute('aria-describedby'),content.id)
    assert.ok(document.getElementById(content.id) === content)
    assert.equal(content.style.pointerEvents,'auto')
  }
  const hidden = async () => {
    await eventually(() => assert.equal(shown(),false))
    assert.equal(trigger.getAttribute('aria-describedby'),null)
  }
  const pointer = (element,type='pointerenter',pointerType='mouse') => element.dispatchEvent(new win.PointerEvent(type,{pointerType}))
  const escape = target => target.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))
  let submits = 0
  document.getElementById('test').addEventListener('submit', event => { event.preventDefault(); submits++ })
  trigger.click()
  assert.equal(submits,0)

  trigger.focus()
  pointer(trigger,'pointerenter','touch')
  await sleep(350)
  assert.equal(shown(),false,'pointer focus or a touch enter does not open supplementary text')
  outside.focus()
  keyboard = true
  trigger.focus()
  await visible()
  pointer(trigger)
  pointer(trigger,'pointerleave')
  await sleep(300)
  assert.equal(shown(),true,'keyboard focus survives incidental pointer departure')
  escape(trigger)
  await hidden()
  assert.ok(document.activeElement === trigger,'Escape does not move keyboard focus')
  pointer(trigger)
  await sleep(350)
  assert.equal(shown(),false,'same focus keeps second activation suppressed')
  pointer(trigger,'pointerleave')
  outside.focus()
  trigger.focus()
  await visible()
  outside.focus()
  await hidden()

  pointer(trigger)
  await visible()
  pointer(trigger,'pointerleave')
  pointer(content)
  await sleep(300)
  assert.equal(shown(),true,'mousing onto popup stays open past trigger grace')
  pointer(content,'pointerleave')
  await hidden()

  pointer(trigger)
  await visible()
  pointer(trigger,'pointerleave')
  escape(outside)
  await hidden()
  assert.ok(document.activeElement === outside,'Escape in the pointer transit gap does not change focus')

  pointer(trigger)
  await visible()
  escape(outside)
  await hidden()
  pointer(trigger,'pointermove')
  await sleep(350)
  assert.equal(shown(),false,'Escape while hovering prevents immediate reopen')
  pointer(trigger,'pointerleave')
  pointer(trigger)
  await visible()
  await dispose()
  assert.equal(escape(outside),true,'document Escape listener removed on disposal')
  await win.happyDOM.close()
} else {
  for (const framework of Object.keys(fixtures)) test(`Ready Tooltip in ${framework}: description, mixed focus/hover, transit Escape and cleanup`, {timeout:60000}, async () => {
    const folder = await mkdtemp(join(repo,'node_modules/.ready-tooltip-'))
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
      await writeFile(entry,entries[framework]+`\nexport { tooltipText } from '${ready}/Tooltip'\n`)
      const plugin = await ({
        react:async()=> (await import('@vitejs/plugin-react')).default(),
        solid:async()=> (await import('vite-plugin-solid')).default(),
        vue:async()=> (await import('@vitejs/plugin-vue')).default(),
        svelte:async()=> (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false}),
      }[framework]())
      const out = join(folder,'out')
      await build({root:repo,configFile:false,logLevel:'error',publicDir:false,plugins:[plugin],
        build:{outDir:out,minify:false,lib:{entry,formats:['es'],fileName:()=> 'entry.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}}})
      execFileSync(process.execPath,[file,'--dom',join(out,'entry.mjs')],{cwd:repo,encoding:'utf8',timeout:18000,stdio:'inherit'})
    } finally { await rm(folder,{recursive:true,force:true}) }
  })
}
