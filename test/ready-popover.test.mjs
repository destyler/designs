import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const { run, popoverText } = await import(pathToFileURL(process.argv[3]))
  const settle = () => new Promise(resolve => setTimeout(resolve, 65))
  const eventually = async (predicate, message) => {
    const deadline = Date.now() + 3000
    while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 16))
    assert.ok(predicate(), message)
  }
  const key = async name => {
    document.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
    await settle()
  }
  async function verify(ownership) {
    const parent = document.createElement('div')
    parent.dataset.rdTheme = 'midnight'
    const outside = document.createElement('button')
    outside.textContent = 'Outside'
    const target = document.createElement('div')
    parent.append(target, outside)
    document.body.append(parent)
    const changes = []
    const cleanup = run(target, {
      trigger: 'Settings', title: 'Preferences', description: 'Adjust your defaults.',
      closeLabel: 'Dismiss preferences', ownership, onOpenChange: value => changes.push(value),
    })
    await settle()
    const trigger = target.querySelector('[data-part=trigger]')
    const content = () => document.getElementById(trigger.getAttribute('aria-controls'))
    const hidden = () => !content() || content().hidden
    assert.equal(trigger.type, 'button')
    assert.equal(trigger.textContent, 'Settings')
    assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog')
    assert.equal(trigger.getAttribute('aria-expanded'), 'false')
    assert.equal(hidden(), true)
    trigger.focus()
    trigger.click()
    await settle()
    assert.deepEqual(changes, [true])
    if (ownership === 'veto') {
      assert.equal(trigger.getAttribute('aria-expanded'), 'false')
      assert.equal(hidden(), true)
      assert.equal(document.activeElement, trigger)
    } else {
      const input = content().querySelector('input')
      const close = content().querySelector('[data-part=close-trigger]')
      assert.equal(content().getAttribute('role'), 'dialog')
      assert.notEqual(content().getAttribute('aria-modal'), 'true')
      assert.equal(document.getElementById(content().getAttribute('aria-labelledby')).textContent, 'Preferences')
      assert.equal(document.getElementById(content().getAttribute('aria-describedby')).textContent, 'Adjust your defaults.')
      assert.equal(content().closest('[data-rd-theme]'), parent)
      assert.equal(close.getAttribute('aria-label'), 'Dismiss preferences')
      assert.equal(document.activeElement, input, 'opening focuses first interactive content')
      assert.notEqual(outside.getAttribute('aria-hidden'), 'true')
      assert.notEqual(document.body.style.overflow, 'hidden')
      assert.notEqual(document.body.style.pointerEvents, 'none')
      input.dispatchEvent(new win.PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
      await key('x')
      assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'inside pointer and ordinary key do not dismiss')
      await key('Escape')
      assert.equal(hidden(), true)
      assert.equal(document.activeElement, trigger, 'Escape restores trigger focus')
      assert.deepEqual(changes, [true, false])
      trigger.click()
      await settle()
      outside.focus()
      await settle()
      assert.equal(hidden(), true, 'focus-out dismisses non-modal')
      assert.equal(document.activeElement, outside, 'outside focus is not stolen')
      trigger.focus()
      trigger.click()
      await settle()
      outside.dispatchEvent(new win.PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
      outside.focus()
      await settle()
      assert.equal(hidden(), true, 'outside pointer dismisses')
      assert.equal(document.activeElement, outside)
      trigger.focus()
      trigger.click()
      await settle()
      content().querySelector('[data-part=close-trigger]').click()
      await settle()
      assert.equal(hidden(), true)
      assert.equal(document.activeElement, trigger, 'close button restores trigger focus')
      assert.deepEqual(changes, [true, false, true, false, true, false, true, false])
    }
    await cleanup()
    parent.remove()
  }
  for (let i = 0; i < 3; i++) {
    const fields = ['Trigger', 'Title', 'Close']
    fields[i] = ' '
    assert.throws(() => popoverText(...fields), /non-whitespace/)
  }
  assert.equal(popoverText('Trigger', 'Title', undefined, ' ').description, undefined)
  const initiallyOpen = document.createElement('div')
  document.body.append(initiallyOpen)
  const dispose = run(initiallyOpen, { ownership: 'uncontrolled', defaultOpen: true,
    trigger: 'Open', title: 'Initially open', description: ' ', onOpenChange() {} })
  await settle()
  const initialContent = initiallyOpen.querySelector('[role=dialog]')
  assert.equal(initialContent.hidden, false)
  assert.equal(initialContent.hasAttribute('aria-describedby'), false)
  assert.equal(document.getElementById(initialContent.getAttribute('aria-labelledby')).textContent, 'Initially open')
  await dispose()
  initiallyOpen.remove()
  await verify('uncontrolled')
  await verify('veto')
  await verify('accept')
  await win.happyDOM.close()
  console.log('PASS Ready Popover')
}

if (process.argv[2] !== '--worker') for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} Popover: inline nonmodal focus, Escape, outside and control`, { timeout: 120000 }, async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-popover-'))
  try {
    const source = `${root}packages/ready/${framework}/Popover.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
    let plugin, code
    if (framework === 'react') {
      plugin = (await import('@vitejs/plugin-react')).default()
      code = `import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Popover} from '${source}';export function run(target, {ownership,onOpenChange,...props}){const root=createRoot(target);function View(){const [open,setOpen]=useState(false);return h(Popover,{...props,open:ownership==='uncontrolled'?undefined:open,onOpenChange:next=>{onOpenChange(next);if(ownership==='accept')setOpen(next)}},h('input',{'aria-label':'Name'}))}root.render(h(View));return()=>root.unmount()}`
    } else if (framework === 'solid') {
      plugin = (await import('vite-plugin-solid')).default()
      code = `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {Popover} from '${source}';export function run(target,{ownership,onOpenChange,...props}){const [open,setOpen]=createSignal(false);return render(()=><Popover {...props} open={ownership==='uncontrolled'?undefined:open()} onOpenChange={next=>{onOpenChange(next);if(ownership==='accept')setOpen(next)}}><input aria-label="Name"/></Popover>,target)}`
    } else if (framework === 'vue') {
      plugin = (await import('@vitejs/plugin-vue')).default()
      code = `import {createApp,h,ref} from 'vue';import Popover from '${source}';export function run(target,{ownership,onOpenChange,...props}){const open=ref(false);const app=createApp({render:()=>h(Popover,{...props,open:ownership==='uncontrolled'?undefined:open.value,onOpenChange:next=>{onOpenChange(next);if(ownership==='accept')open.value=next}},{default:()=>h('input',{'aria-label':'Name'})})});app.mount(target);return()=>app.unmount()}`
    } else {
      plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
      await writeFile(join(folder, 'Fixture.svelte'), `<script>import Popover from '${source}';let {ownership,onOpenChange,...props}=$props();let open=$state(false);</script><Popover {...props} open={ownership==='uncontrolled'?undefined:open} onOpenChange={next=>{onOpenChange(next);if(ownership==='accept')open=next}}><input aria-label="Name"/></Popover>`)
      code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,props){const app=mount(Fixture,{target,props});return()=>unmount(app)}`
    }
    const entry = join(folder, 'entry.tsx')
    await writeFile(entry, code + `
export { popoverText } from '${root}packages/ready/Popover.ts'`)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready Popover/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
