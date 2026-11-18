import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))
if (process.argv[2] === '--ready-worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const { run } = await import(pathToFileURL(process.argv[3]))
  const settle = () => new Promise(resolve => setTimeout(resolve, 80))
  const cleanups = []
  const scopes = []
  for (const theme of ['default', 'midnight']) {
    const scope = document.createElement('section'); scope.dataset.rdTheme = theme; document.body.append(scope)
    cleanups.push(run(scope, 'demo', theme, [])); scopes.push(scope)
  }
  await settle()
  const part = (scope, name, item) => scope.querySelector(`[data-scope="${name}"][data-part="${item}"]`)
  const click = async node => { assert.ok(node); node.click(); await settle() }
  for (const scope of scopes) {
    assert.equal(scope.querySelector('input[type=checkbox]').name, 'updates')
    assert.equal(scope.querySelector('select').name, 'plan')
    await click(part(scope, 'checkbox', 'control'))
    assert.equal(scope.querySelector('input[type=checkbox]').checked, true)
    await click(part(scope, 'checkbox', 'control'))
    assert.equal(scope.querySelector('input[type=checkbox]').checked, false)
    await click(part(scope, 'select', 'trigger'))
    const disabled = scope.querySelector('[data-scope="select"][data-part="item"][data-value="enterprise"]')
    assert.equal(disabled.getAttribute('aria-disabled'), 'true')
    await click(disabled)
    assert.equal(scope.querySelector('select').value, '')
    await click(scope.querySelector('[data-scope="select"][data-part="item"][data-value="studio"]'))
    assert.equal(scope.querySelector('select').value, 'studio')
    for (let n = 0; n < 2; n++) {
      if (n === 1) {
        scope.dataset.rdTheme = scope.dataset.rdTheme === 'default' ? 'midnight' : 'default'
        // DOM contract only: no computed-style or visual equivalence assertion.
        scope.style.setProperty('--rd-accent', '#123456')
      }
      await click(part(scope, 'dialog', 'trigger'))
      const content = part(scope, 'dialog', 'content')
      assert.ok(content && !content.hidden)
      assert.equal(document.getElementById(content.getAttribute('aria-labelledby')).textContent, 'Your workspace')
      assert.match(document.getElementById(content.getAttribute('aria-describedby')).textContent, /theme changes/)
      assert.ok(scope.contains(content), 'Inline overlay inherits its theme scope')
      assert.equal(content.closest('[data-rd-theme]'), scope)
      if (n === 1) {
        assert.equal(scope.style.getPropertyValue('--rd-accent'), '#123456')
        assert.equal(scope.querySelector('select').value, 'studio', 'Theme replacement preserves selection')
      }
      await click(part(scope, 'dialog', 'close-trigger'))
      assert.equal(part(scope, 'dialog', 'trigger').getAttribute('aria-expanded'), 'false')
    }
    await click(part(scope, 'dialog', 'trigger'))
    document.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await settle()
    assert.equal(part(scope, 'dialog', 'trigger').getAttribute('aria-expanded'), 'false', 'Escape closes the dialog')
  }
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id)
  assert.equal(new Set(ids).size, ids.length, 'Two theme scopes have unique IDs')
  const frozen = document.createElement('section'); document.body.append(frozen)
  const events = []; cleanups.push(run(frozen, 'frozen', 'frozen', events)); await settle()
  await click(part(frozen, 'checkbox', 'control'))
  assert.equal(frozen.querySelector('input[type=checkbox]').checked, false, 'Controlled false does not become uncontrolled')
  await click(part(frozen, 'select', 'trigger'))
  await click(frozen.querySelector('[data-scope="select"][data-part="item"][data-value="a"]'))
  assert.equal(frozen.querySelector('select').value, '', 'Controlled empty selection stays empty')
  await click(part(frozen, 'dialog', 'trigger'))
  assert.equal(part(frozen, 'dialog', 'trigger').getAttribute('aria-expanded'), 'false')
  assert.deepEqual(events, [['checked', true], ['value', 'a'], ['open', true]])
  const uncontrolled = document.createElement('section'); document.body.append(uncontrolled)
  cleanups.push(run(uncontrolled, 'uncontrolled', 'uncontrolled', [])); await settle()
  await click(part(uncontrolled, 'checkbox', 'control'))
  assert.equal(uncontrolled.querySelector('input[type=checkbox]').checked, true)
  await click(part(uncontrolled, 'select', 'trigger'))
  await click(uncontrolled.querySelector('[data-scope="select"][data-part="item"][data-value="a"]'))
  assert.equal(uncontrolled.querySelector('select').value, 'a')
  await click(part(uncontrolled, 'dialog', 'trigger'))
  assert.equal(part(uncontrolled, 'dialog', 'trigger').getAttribute('aria-expanded'), 'true')
  await click(part(uncontrolled, 'dialog', 'close-trigger'))
  assert.equal(part(uncontrolled, 'dialog', 'trigger').getAttribute('aria-expanded'), 'false')
  for (const cleanup of cleanups) await cleanup()
  await win.happyDOM.close()
  console.log('READY multi-scope/controlled/disabled/dialog simulated interactions: PASS')
} else {
  for (const framework of ['vue', 'svelte']) test(`Ready ${framework}: two scopes and controlled interactions`, { timeout: 120000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-vs-'))
    try {
      const { build } = await import('vite')
      let plugin, code
      if (framework === 'vue') {
        plugin = (await import('@vitejs/plugin-vue')).default()
        code = `import { createApp, h } from 'vue'; import Demo from '${root}examples/ready/vue/Demo.vue'; import { Checkbox, Select, Dialog } from '${root}packages/ready/vue'; export function run(target, kind, id, events) { const Frozen = { render: () => h('div', [h(Checkbox,{label:'Frozen',...(kind==='frozen'?{checked:false}:{}),onCheckedChange:value=>events.push(['checked',value])}),h(Select,{label:'Frozen choice',...(kind==='frozen'?{value:''}:{}),options:[{label:'A',value:'a'}],onValueChange:value=>events.push(['value',value])}),h(Dialog,{trigger:'Open',title:'Frozen dialog',...(kind==='frozen'?{open:false}:{}),onOpenChange:value=>events.push(['open',value])})]) }; const app=createApp(kind==='demo'?Demo:Frozen);app.config.idPrefix='ready-'+id;app.mount(target);return()=>app.unmount(); }`
      } else {
        plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
        await writeFile(join(folder, 'Frozen.svelte'), `<script>import { Checkbox, Select, Dialog } from '${root}packages/ready/svelte'; let {events,controlled}=$props();</script><Checkbox label="Frozen" checked={controlled ? false : undefined} onCheckedChange={value=>events.push(['checked',value])}/><Select label="Frozen choice" value={controlled ? '' : undefined} options={[{label:'A',value:'a'}]} onValueChange={value=>events.push(['value',value])}/><Dialog trigger="Open" title="Frozen dialog" open={controlled ? false : undefined} onOpenChange={value=>events.push(['open',value])}/>`)
        code = `import {mount,unmount} from 'svelte';import Demo from '${root}examples/ready/svelte/Demo.svelte';import Frozen from './Frozen.svelte';export function run(target,kind,id,events){const app=mount(kind==='demo'?Demo:Frozen,{target,props:{events,controlled:kind==='frozen'}});return()=>unmount(app);}`
      }
      const entry = join(folder, 'entry.mjs'); await writeFile(entry, code)
      await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
      const output = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--ready-worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.match(output, /simulated interactions: PASS/)
    } finally { await rm(folder, { recursive: true, force: true }) }
  })
}
