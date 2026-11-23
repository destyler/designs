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
  const { run, toggleGroupModel } = await import(pathToFileURL(process.argv[3]))
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
  const first = { value: 'bold', label: 'Bold' }
  const blocked = { value: 'underline', label: 'Underline', disabled: true }
  const last = { value: 'italic', label: 'Italic' }
  const items = [first, blocked, last]
  const label = 'Text styles'
  async function verify(ownership, orientation) {
    const target = document.createElement('div')
    document.body.append(target)
    const changes = []
    const cleanup = run(target, {
      label, items, ownership, orientation, loopFocus: orientation !== 'vertical',
      ...ownership === 'uncontrolled' ? { defaultValue: ['bold'] } : { value: ['bold'] },
      onResult: value => changes.push(value),
    })
    await settle()
    const group = target.querySelector('[role=group]')
    assert.ok(group, 'semantic group')
    assert.equal(group.getAttribute('aria-label'), label)
    assert.equal(group.getAttribute('data-orientation'), orientation)
    assert.equal(group.querySelectorAll('[role=radio],[aria-checked]').length, 0)
    const [bold, underline, italic] = group.querySelectorAll('button')
    const pressed = () => Array.from(group.querySelectorAll('button'), item => item.getAttribute('aria-pressed'))
    assert.deepEqual(pressed(), ['true', 'false', 'false'])
    assert.equal(bold.type, 'button')
    assert.equal(underline.disabled, true)
    underline.click()
    group.focus()
    await eventually(() => document.activeElement === bold, 'entry focuses first enabled item')
    await key(orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight')
    assert.ok(document.activeElement === italic, 'next skips disabled')
    await key(orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight')
    assert.ok(document.activeElement === (orientation === 'vertical' ? italic : bold), 'boundary follows loopFocus')
    await key('Home')
    assert.ok(document.activeElement === bold, 'Home reaches first')
    await key('End')
    assert.ok(document.activeElement === italic, 'End reaches last')
    assert.deepEqual(changes, [], 'focus movement and disabled click do not change values')
    italic.click()
    await settle()
    assert.deepEqual(changes, [['bold', 'italic']])
    if (ownership === 'veto') {
      assert.deepEqual(pressed(), ['true', 'false', 'false'])
    } else {
      assert.deepEqual(pressed(), ['true', 'false', 'true'], 'multiple independent presses')
      bold.click()
      await settle()
      assert.deepEqual(changes, [['bold', 'italic'], ['italic']])
      assert.deepEqual(pressed(), ['false', 'false', 'true'])
      italic.click()
      await settle()
      assert.deepEqual(changes, [['bold', 'italic'], ['italic'], []])
      assert.deepEqual(pressed(), ['false', 'false', 'false'])
    }
    await cleanup()
    target.remove()
  }
  await verify('uncontrolled', 'horizontal')
  await verify('accept', 'vertical')
  await verify('veto', 'horizontal')
  for (const props of [{ disabled: true, items }, { items: [blocked] }]) {
    const target = document.createElement('div')
    document.body.append(target)
    const done = run(target, { label, ...props, onResult: () => assert.fail('disabled group changed') })
    await settle()
    const group = target.querySelector('[role=group]')
    assert.equal(group.getAttribute('aria-disabled'), 'true')
    assert.equal(group.tabIndex, -1, 'disabled group does not add a Tab stop')
    for (const button of group.querySelectorAll('button')) {
      assert.equal(button.disabled, true)
      button.click()
    }
    await settle()
    await done()
    target.remove()
  }
  assert.throws(() => toggleGroupModel({ label: ' ', items }), /non-whitespace/)
  assert.throws(() => toggleGroupModel({ label, items: [] }), /at least one/)
  assert.throws(() => toggleGroupModel({ label, items: [first, first] }), /unique/)
  assert.throws(() => toggleGroupModel({ label, items: [{ ...first, value: 'a b' }] }), /whitespace/)
  assert.throws(() => toggleGroupModel({ label, items: [{ ...first, label: ' ' }] }), /non-whitespace/)
  assert.throws(() => toggleGroupModel({ label, items, value: ['missing'] }), /distinct/)
  assert.throws(() => toggleGroupModel({ label, items, defaultValue: ['bold', 'bold'] }), /distinct/)
  const selected = Object.freeze(['bold'])
  assert.notEqual(toggleGroupModel({ label, items, value: selected }).value, selected, 'do not hand caller arrays to the primitive')
  await win.happyDOM.close()
  console.log('PASS Ready ToggleGroup')
}

if (process.argv[2] !== '--worker') for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} ToggleGroup: independent press, native rover, disabled and controlled ownership`, { timeout: 120000 }, async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-toggle-group-'))
  try {
    const source = `${root}packages/ready/${framework}/ToggleGroup.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
    let plugin, code
    if (framework === 'react') {
      plugin = (await import('@vitejs/plugin-react')).default()
      code = `import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {ToggleGroup} from '${source}';export function run(target, {ownership,onResult,...props}){const root=createRoot(target);function View(){const [value,setValue]=useState(props.value);return h(ToggleGroup,{...props,value,onValueChange:next=>{onResult(next);if(ownership==='accept')setValue(next)}})}root.render(h(View));return()=>root.unmount()}`
    } else if (framework === 'solid') {
      plugin = (await import('vite-plugin-solid')).default()
      code = `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {ToggleGroup} from '${source}';export function run(target,{ownership,onResult,...props}){const [value,setValue]=createSignal(props.value);return render(()=><ToggleGroup {...props} value={value()} onValueChange={next=>{onResult(next);if(ownership==='accept')setValue(next)}}/>,target)}`
    } else if (framework === 'vue') {
      plugin = (await import('@vitejs/plugin-vue')).default()
      code = `import {createApp,h,ref} from 'vue';import ToggleGroup from '${source}';export function run(target,{ownership,onResult,...props}){const value=ref(props.value);const app=createApp({render:()=>h(ToggleGroup,{...props,value:value.value,onValueChange:next=>{onResult(next);if(ownership==='accept')value.value=next}})});app.mount(target);return()=>app.unmount()}`
    } else {
      plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
      await writeFile(join(folder, 'Fixture.svelte'), `<script>import ToggleGroup from '${source}';let {ownership,onResult,...props}=$props();let value=$state(props.value);</script><ToggleGroup {...props} {value} onValueChange={next=>{onResult(next);if(ownership==='accept')value=next}}/>`)
      code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,props){const app=mount(Fixture,{target,props});return()=>unmount(app)}`
    }
    const entry = join(folder, 'entry.tsx')
    await writeFile(entry, code + `
export { toggleGroupModel } from '${root}packages/ready/ToggleGroup.ts'`)
    const { build } = await import('vite')
    await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
    assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready ToggleGroup/)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
