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
const markup = `<form><Timer label="Elapsed" resetLabel="Zero" /></form>`
const fixtures = {
  react: `import {Timer} from '${ready}/react/Timer';export default function App(){return ${markup}}`,
  solid: `import {Timer} from '${ready}/solid/Timer';export default function App(){return ${markup}}`,
  vue: `<script setup>import Timer from '${ready}/vue/Timer.vue'</script><template>${markup}</template>`,
  svelte: `<script>import Timer from '${ready}/svelte/Timer.svelte'</script>${markup}`,
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
  // Drive the real primitive's scheduling and cleanup deterministically.
  const realSetInterval = globalThis.setInterval
  const realClearInterval = globalThis.clearInterval
  const active = new Map()
  let serial = 0
  globalThis.setInterval = (callback, delay, ...args) => {
    if (delay !== 1000) return realSetInterval(callback,delay,...args)
    active.set(++serial,()=>callback(...args))
    return serial
  }
  globalThis.clearInterval = id => typeof id === 'number' && id <= serial ? active.delete(id) : realClearInterval(id)
  const tick = () => { for (const fn of active.values()) fn() }
  document.body.innerHTML = '<main id="app"></main>'
  const { dispose, timerText, timerDisplay } = await import(pathToFileURL(process.argv[3]))
  assert.throws(() => timerText({label:'Elapsed',resetLabel:' '}),/resetLabel/)
  assert.equal(timerDisplay({days:'01',hours:'02',minutes:'03',seconds:'04'}),'01:02:03:04')
  await eventually(() => assert.equal(document.querySelectorAll('[role=timer]').length,1))
  const form = document.querySelector('form')
  const area = form.querySelector('[role=timer]')
  const [action,reset] = form.querySelectorAll('button')
  let submissions = 0
  form.addEventListener('submit',event=>{event.preventDefault();submissions++})
  const shown = expected => eventually(() => assert.equal(area.textContent,expected))
  const command = expected => eventually(() => {
    assert.equal(action.textContent,expected)
    assert.equal(action.hidden,false)
    assert.equal(form.querySelector('button') === action,true,'primary control stays the same native element')
  })
  const scheduled = count => eventually(() => assert.equal(active.size,count))
  assert.equal(form.querySelector('[role=group]').getAttribute('aria-label'),'Elapsed')
  assert.equal(area.getAttribute('aria-live'),'off')
  assert.equal(area.getAttribute('aria-label'),'0 days 00:00:00')
  assert.equal(action.type,'button')
  assert.equal(action.hasAttribute('action'),false)
  assert.equal(reset.type,'button')
  assert.equal(reset.textContent,'Zero')
  await shown('00:00:00')
  await scheduled(0)
  await command('Start')
  action.focus()
  action.click()
  await command('Pause')
  await scheduled(1)
  tick()
  tick()
  await shown('00:00:02')
  assert.equal(area.getAttribute('aria-label'),'0 days 00:00:02')
  assert.equal(document.activeElement === action,true)
  action.click()
  await command('Resume')
  await scheduled(0)
  tick()
  await shown('00:00:02')
  action.click()
  await command('Pause')
  await scheduled(1)
  tick()
  await shown('00:00:03')
  reset.focus()
  reset.click()
  await command('Start')
  await shown('00:00:00')
  await scheduled(0)
  assert.equal(document.activeElement === reset,true)
  action.click()
  await command('Pause')
  await scheduled(1)
  tick()
  await shown('00:00:01')
  action.click()
  await command('Resume')
  reset.click()
  await command('Start')
  await shown('00:00:00')
  await scheduled(0)
  action.click()
  await scheduled(1)
  await dispose()
  await scheduled(0)
  assert.equal(submissions,0)
  globalThis.setInterval = realSetInterval
  globalThis.clearInterval = realClearInterval
  await win.happyDOM.close()
} else {
  for (const framework of Object.keys(fixtures)) test(`Ready Timer in ${framework}: stopwatch transitions, stable focus and cleanup`, {timeout:60000}, async () => {
    const folder = await mkdtemp(join(repo,'node_modules/.ready-timer-'))
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
      await writeFile(entry,entries[framework]+`\nexport { timerText, timerDisplay } from '${ready}/Timer'\n`)
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
