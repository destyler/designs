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
const body = (change, disabled) => `
  <form><button id="before" type="button">Before</button>
    <section id="main"><Signature label="Sketch" ${change} /></section>
    <button id="disable" type="button" ${disabled}>Disable active</button>
    <section id="disabled"><Signature label="Locked sketch" disabled /></section>
    <button id="after" type="button">After</button>
  </form>`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Signature} from '${ready}/react/Signature';
    function App(){const [disabled,setDisabled]=useState(false); return (${body('disabled={disabled} onPathsChange={window.record}', 'onClick={()=>setDisabled(!disabled)}')})}
    createRoot(document.getElementById('app')).render(<App/>);`,
  solid: `import {render} from 'solid-js/web';import {createSignal} from 'solid-js';import {Signature} from '${ready}/solid/Signature';
    const [disabled,setDisabled]=createSignal(false);render(()=> (${body('disabled={disabled()} onPathsChange={window.record}', 'onClick={()=>setDisabled(!disabled())}')}),document.getElementById('app'));`,
  vue: `<script setup>import {ref} from 'vue';import Signature from '${ready}/vue/Signature.vue';const disabled=ref(false);const record=window.record;</script>
    <template>${body(':disabled="disabled" @paths-change="record"', '@click="disabled=!disabled"')}</template>`,
  svelte: `<script>import Signature from '${ready}/svelte/Signature.svelte';let disabled=$state(false);const record=window.record;</script>
    ${body('{disabled} onPathsChange={record}', 'onclick={()=>disabled=!disabled}')}`,
}
const parts = name => `[data-scope="signature"][data-part="${name}"]`

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window()
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|KeyboardEvent|FocusEvent|MouseEvent|PointerEvent|CSS|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  const values = []
  window.record = paths => values.push([...paths])
  await import(pathToFileURL(process.argv[3]))
  const pause = delay => new Promise(resolve => setTimeout(resolve, delay))
  const eventually = async read => {
    for (let i = 0; i < 80; i++) {
      try { return read() } catch (error) {
        if (i === 79) throw error
        await pause(20)
      }
    }
  }
  const group = await eventually(() => {
    const node = document.querySelector('#main [role=group]')
    assert.ok(node?.querySelector(parts('control')), document.body.innerHTML)
    return node
  })
  const control = group.querySelector(parts('control'))
  const clear = group.querySelector(parts('clear-trigger'))
  const locked = document.querySelector(`#disabled ${parts('control')}`)
  const disable = document.querySelector('#disable')
  const before = document.querySelector('#before')
  assert.equal(document.getElementById(group.getAttribute('aria-labelledby')).textContent,'Sketch')
  assert.match(document.getElementById(group.getAttribute('aria-describedby')).textContent,/Optional/)
  assert.ok(!control.hasAttribute('role') && !control.hasAttribute('tabindex'))
  assert.equal(control.getAttribute('aria-hidden'),'true')
  assert.equal(group.querySelector('input'),null)
  assert.equal(clear.type,'button')
  assert.equal(document.querySelector(`#disabled ${parts('clear-trigger')}`).disabled,true)
  for (const node of [control,locked]) {
    let captured = false
    node.getBoundingClientRect = () => ({top:0,left:0,width:300,height:180})
    node.setPointerCapture = () => { captured = true }
    node.releasePointerCapture = () => { captured = false }
    node.hasPointerCapture = () => captured
  }
  function send(node,type,x,y,button=0,primary=true,id=11) {
    node.dispatchEvent(new window.PointerEvent(type,{bubbles:true,cancelable:true,button,pointerType:'mouse',
      isPrimary:primary,pointerId:id,pressure:.5,clientX:x,clientY:y}))
  }
  const shapes = () => [...control.querySelectorAll(`${parts('segment-path')}:not([data-draft])`)].map(node=>node.getAttribute('d'))
  const draw = (base=20) => {
    send(control,'pointerdown',base,20)
    for (let i=1;i<10;i++) send(control,'pointermove',base+i*6,20+i*4,-1)
  }
  send(locked,'pointerdown',20,20)
  send(locked,'pointermove',40,50,-1)
  send(locked,'pointerup',40,50)
  assert.equal(locked.querySelector(parts('segment-path')),null)
  send(control,'pointerdown',20,20,2)
  assert.equal(control.querySelector(parts('segment-path')),null)
  draw()
  await eventually(() => assert.ok(control.querySelector('[data-draft]')))
  send(control,'pointerup',80,70)
  await eventually(() => { assert.equal(values.length,1); assert.equal(shapes().length,1) })
  assert.ok(values[0][0].startsWith('M'))
  draw(50)
  send(control,'pointercancel',100,75)
  await eventually(() => assert.equal(control.querySelector('[data-draft]'),null))
  assert.deepEqual(shapes(),values[0]); assert.equal(values.length,1)
  draw(80)
  send(control,'lostpointercapture',125,65)
  await eventually(() => assert.equal(control.querySelector('[data-draft]'),null))
  assert.deepEqual(shapes(),values[0]); assert.equal(values.length,1)
  draw(90)
  disable.click()
  await eventually(() => { assert.equal(clear.disabled,true); assert.equal(control.querySelector('[data-draft]'),null) })
  assert.deepEqual(shapes(),values[0]); assert.equal(values.length,1)
  disable.click()
  await eventually(() => assert.equal(clear.disabled,false))
  draw(110)
  send(control,'pointerup',170,80)
  await eventually(() => { assert.equal(values.length,2); assert.equal(shapes().length,2) })
  clear.focus(); clear.click()
  await eventually(() => {
    assert.deepEqual(values[2],[]); assert.deepEqual(shapes(),[]);
    assert.ok(document.activeElement===clear)
  })
  before.focus()
  clear.click() // No-op on an already-empty pad.
  assert.equal(values.length,3)
  await dom.happyDOM.close()
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Signature draws, cancels strokes and clears accessibly in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-signature-'))
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
        await build({
          root, configFile:false, logLevel:'error', plugins:[plugin],
          // Vite library mode leaves process.env references intact unless defined.
          define:{'process.env.NODE_ENV':JSON.stringify('production')},
          build:{outDir:join(dir,'out'),lib:{entry,formats:['es'],fileName:()=> 'signature.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}},
        })
        const bundle = join(dir,'out/signature.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle], { timeout:12000, stdio:'inherit' })
        if (process.env.READY_CHROMIUM_PATH) {
          const { chromium } = await import('playwright')
          const browser = await chromium.launch({executablePath:process.env.READY_CHROMIUM_PATH})
          const errors = []
          try {
            const page = await browser.newPage()
            page.setDefaultTimeout(4500)
            page.on('pageerror', error => errors.push(error.message))
            await page.setContent('<main id="app"></main><script>window.values=[];window.submits=0;window.record=v=>window.values.push(v);document.addEventListener("submit",e=>{e.preventDefault();window.submits++})</script>')
            await page.addStyleTag({content:await readFile(join(ready,'Signature.css'),'utf8')})
            await page.addScriptTag({type:'module',content:await readFile(bundle,'utf8')})
            const main = page.getByRole('group',{name:'Sketch',exact:true})
            const control = main.locator(parts('control'))
            const clear = main.getByRole('button',{name:'Clear Sketch'})
            const committed = control.locator(`${parts('segment-path')}:not([data-draft])`)
            const bounds = await control.boundingBox()
            assert.ok(bounds && bounds.width > 100 && bounds.height > 100)
            await control.evaluate(node => node.addEventListener('pointerdown', event => { window.drawingPointer=event.pointerId }))
            const begin = async (offset=0) => {
              await page.mouse.move(bounds.x+20+offset,bounds.y+30)
              await page.mouse.down()
              await page.mouse.move(bounds.x+100+offset,bounds.y+85,{steps:8})
              await control.locator('[data-draft]').waitFor({state:'attached'})
            }
            await begin()
            await page.mouse.up()
            await page.waitForFunction(()=>window.values.length===1)
            assert.equal(await committed.count(),1)
            const first = await committed.first().getAttribute('d')
            await begin(25)
            await control.evaluate(node=>node.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:window.drawingPointer,pointerType:'mouse',isPrimary:true})))
            await page.mouse.up()
            await control.locator('[data-draft]').waitFor({state:'detached'})
            assert.deepEqual(await page.evaluate(()=>window.values),[[first]])
            await begin(45)
            await control.evaluate(node=>node.releasePointerCapture(window.drawingPointer))
            await page.mouse.move(bounds.x+150,bounds.y+100)
            await page.mouse.up()
            await control.locator('[data-draft]').waitFor({state:'detached'})
            assert.deepEqual(await page.evaluate(()=>window.values),[[first]])
            await begin(65)
            await page.locator('#disable').evaluate(button=>button.click())
            await page.mouse.up()
            assert.equal(await clear.isDisabled(),true)
            await control.locator('[data-draft]').waitFor({state:'detached'})
            assert.deepEqual(await page.evaluate(()=>window.values),[[first]])
            await page.locator('#disable').click()
            await begin(85)
            await page.mouse.up()
            await page.waitForFunction(()=>window.values.length===2)
            assert.equal(await committed.count(),2)
            await page.locator('#before').focus()
            await page.keyboard.press('Tab')
            assert.equal(await clear.evaluate(el=>document.activeElement===el),true)
            await page.keyboard.press('Space')
            await page.waitForFunction(()=>window.values.length===3)
            assert.equal(await clear.evaluate(el=>document.activeElement===el),true)
            assert.deepEqual(await page.evaluate(()=>window.values.at(-1)),[])
            assert.equal(await committed.count(),0)
            assert.equal(await page.evaluate(()=>window.submits),0)
          } finally {
            await browser.close()
            assert.deepEqual(errors,[],'Signature browser fixture runtime errors')
          }
        }
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
