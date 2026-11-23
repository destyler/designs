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
  const { run, floatingPanelText } = await import(pathToFileURL(process.argv[3]))
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
      trigger: 'Open inspector', title: 'Inspector', moveHint: 'Arrow keys move this panel.',
      closeLabel: 'Dismiss inspector', ownership, onOpenChange: value => changes.push(value),
    })
    const find = part => target.querySelector(`[data-scope=floating-panel][data-part=${part}]`)
    const trigger = find('trigger') ?? await eventually(() => find('trigger'), 'mounted trigger').then(() => find('trigger'))
    await settle()
    const content = () => find('content')
    const hidden = () => !content() || content().hidden
    const fire = (element, name, extra) => {
      const event = new win.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...extra })
      element.dispatchEvent(event)
      return event
    }
    assert.equal(trigger.type, 'button')
    assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog')
    assert.equal(trigger.getAttribute('aria-expanded'), 'false')
    assert.equal(hidden(), true)
    trigger.click()
    await settle()
    assert.deepEqual(changes, [true])
    if (ownership === 'veto') {
      assert.equal(trigger.getAttribute('aria-expanded'), 'false')
      assert.equal(hidden(), true)
      assert.ok(document.activeElement === trigger)
    } else {
      const positioner = find('positioner')
      const input = content().querySelector('input')
      const close = find('close-trigger')
      assert.equal(trigger.getAttribute('aria-expanded'), 'true')
      assert.ok(document.getElementById(trigger.getAttribute("aria-controls")) === content(), "trigger controls content");
      assert.equal(content().getAttribute('role'), 'dialog')
      assert.notEqual(content().getAttribute('aria-modal'), 'true')
      assert.equal(document.getElementById(content().getAttribute('aria-labelledby')).textContent, 'Inspector')
      assert.equal(document.getElementById(content().getAttribute('aria-describedby')).textContent, 'Arrow keys move this panel.')
      assert.equal(content().closest('[data-rd-theme]'), parent)
      assert.equal(close.textContent, 'Dismiss inspector')
      assert.ok(document.activeElement === content(), 'accepted opening focuses the movable panel')
      const x = () => Number.parseFloat(positioner.style.getPropertyValue('--x'))
      const start = x()
      assert.equal(fire(content(), 'ArrowRight').defaultPrevented, true)
      await eventually(() => x() === start + 8, 'right arrow advances native position 8px')
      assert.equal(fire(content(), 'ArrowLeft', { shiftKey: true }).defaultPrevented, true)
      await eventually(() => x() === 0, 'accelerated left arrow clamps to viewport')
      input.focus()
      assert.equal(fire(input, 'ArrowRight').defaultPrevented, false)
      await settle()
      assert.equal(x(), 0, 'inner input arrows retain native text editing')
      const before = positioner.style.cssText
      find('drag-trigger').dispatchEvent(new win.MouseEvent('dblclick', { bubbles: true, cancelable: true }))
      await settle()
      assert.equal(positioner.style.cssText, before, 'double click cannot change stage')
      fire(input, 'Escape', { isComposing: true })
      await settle()
      assert.equal(hidden(), false, 'Escape can cancel composition without closing')
      outside.focus()
      assert.equal(hidden(), false, 'outside focus does not dismiss a floating panel')
      input.focus()
      await key('Escape')
      assert.deepEqual(changes, [true, false])
      if (ownership === 'veto-close') {
        assert.equal(hidden(), false)
        assert.ok(document.activeElement === input, 'close veto leaves focus intact')
      } else {
        assert.equal(hidden(), true)
        assert.ok(document.activeElement === trigger, 'Escape restores in-panel focus to trigger')
        trigger.click()
        await eventually(() => !hidden(), 'reopened')
        outside.focus()
        find('close-trigger').click()
        await eventually(hidden, 'outside-focus dismissal')
        assert.ok(document.activeElement === outside, 'accepted close never steals outside focus')
        trigger.click()
        await eventually(() => !hidden(), 'reopened after outside-focus dismissal')
        find('close-trigger').focus()
        find('close-trigger').click()
        await eventually(hidden, 'inside-focus dismissal')
        assert.ok(document.activeElement === trigger)
        assert.deepEqual(changes, [true, false, true, false, true, false])
      }
    }
    await cleanup()
    parent.remove()
  }
  for (let i = 0; i < 4; i++) {
    const fields = ['Trigger', 'Title', 'Arrow help', 'Close']
    fields[i] = ' '
    assert.throws(() => floatingPanelText(...fields), /non-whitespace/)
  }
  const initiallyOpen = document.createElement('div')
  document.body.append(initiallyOpen)
  const dispose = run(initiallyOpen, { ownership: 'uncontrolled', defaultOpen: true,
    trigger: 'Open', title: 'Initially open', onOpenChange() {} })
  await eventually(() => initiallyOpen.querySelector('[role=dialog]:not([hidden])'), 'default open panel')
  assert.ok(document.activeElement === document.body, 'default open does not steal page focus')
  await dispose()
  initiallyOpen.remove()
  for (const ownership of ['uncontrolled', 'veto', 'accept', 'veto-close']) await verify(ownership)
  await win.happyDOM.close()
  console.log('PASS Ready FloatingPanel')
}

if (process.argv[2] !== '--worker') for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} FloatingPanel: native panel keyboard movement, IME, focus and control`, { timeout: 120000 }, async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-floating-panel-'))
  try {
    const source = `${root}packages/ready/${framework}/FloatingPanel.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
    let plugin, code
    if (framework === 'react') {
      plugin = (await import('@vitejs/plugin-react')).default()
      code = `import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {FloatingPanel} from '${source}';export function run(target, {ownership,onOpenChange,...props}){const root=createRoot(target);function View(){const [open,setOpen]=useState(false);return h(FloatingPanel,{...props,open:ownership==='uncontrolled'?undefined:open,onOpenChange:next=>{onOpenChange(next);if(ownership==='accept'||(ownership==='veto-close'&&next))setOpen(next)}},h('input',{'aria-label':'Name'}))}root.render(h(View));return()=>root.unmount()}`
    } else if (framework === 'solid') {
      plugin = (await import('vite-plugin-solid')).default()
      code = `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {FloatingPanel} from '${source}';export function run(target,{ownership,onOpenChange,...props}){const [open,setOpen]=createSignal(false);return render(()=><FloatingPanel {...props} open={ownership==='uncontrolled'?undefined:open()} onOpenChange={next=>{onOpenChange(next);if(ownership==='accept'||(ownership==='veto-close'&&next))setOpen(next)}}><input aria-label="Name"/></FloatingPanel>,target)}`
    } else if (framework === 'vue') {
      plugin = (await import('@vitejs/plugin-vue')).default()
      code = `import {createApp,h,ref} from 'vue';import FloatingPanel from '${source}';export function run(target,{ownership,onOpenChange,...props}){const open=ref(false);const app=createApp({render:()=>h(FloatingPanel,{...props,open:ownership==='uncontrolled'?undefined:open.value,onOpenChange:next=>{onOpenChange(next);if(ownership==='accept'||(ownership==='veto-close'&&next))open.value=next}},{default:()=>h('input',{'aria-label':'Name'})})});app.mount(target);return()=>app.unmount()}`
    } else {
      plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
      await writeFile(join(folder, 'Fixture.svelte'), `<script>import FloatingPanel from '${source}';let {ownership,onOpenChange,...props}=$props();let open=$state(false);</script><FloatingPanel {...props} open={ownership==='uncontrolled'?undefined:open} onOpenChange={next=>{onOpenChange(next);if(ownership==='accept'||(ownership==='veto-close'&&next))open=next}}><input aria-label="Name"/></FloatingPanel>`)
      code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,props){const app=mount(Fixture,{target,props});return()=>unmount(app)}`
    }
    const entry = join(folder, 'entry.tsx')
    await writeFile(entry, code + `
export { floatingPanelText } from '${root}packages/ready/FloatingPanel.ts'`)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready FloatingPanel/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
