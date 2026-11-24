import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { openReadyDom, readyEventually, runReadyFixture } from './helpers/ready-browser-fixture.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const ready = `${root}packages/ready`
const presets = "['#123abc', '#bb7700', '#BB7700']"
const log = "const record=(label,hex)=>document.querySelector('#events').textContent += label+':'+hex+';';"
const markup = (bind, event, managed, disabled) => `<main>
  <section id="local"><ColorPicker label="Accent" defaultValue="#123abc" ${bind('presets', presets)}
    ${event('record("local",next)')} /></section>
  <section id="fixed"><ColorPicker label="Fixed accent" value="#123abc" ${bind('presets', presets)}
    ${event('record("fixed",next)')} /></section>
  <section id="managed"><ColorPicker label="Managed accent" ${bind('value', managed)} ${bind('presets', presets)}
    ${event('accept(next)')} /></section>
  <section id="disabled"><ColorPicker label="Disabled accent" defaultValue="#123abc" ${bind('presets', presets)} ${disabled}
    ${event('record("disabled",next)')} /></section>
  <output id="events"></output>
</main>`
const jsx = (name, code) => `${name}={${code}}`
const event = code => `onValueChange={next=>${code}}`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {ColorPicker} from '${ready}/react/ColorPicker.tsx';
    ${log} function App(){const [chosen,setChosen]=useState('#123ABC');const accept=next=>{record('managed',next);setChosen(next)};return(${markup(jsx,event,'chosen','disabled')})}
    createRoot(document.getElementById('app')).render(<App/>)`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {ColorPicker} from '${ready}/solid/ColorPicker.tsx';
    ${log} function App(){const [chosen,setChosen]=createSignal('#123ABC');const accept=next=>{record('managed',next);setChosen(next)};return(${markup(jsx,event,'chosen()','disabled')})}
    render(()=> <App/>,document.getElementById('app'))`,
  vue: `<script setup>import {ref} from 'vue';import ColorPicker from '${ready}/vue/ColorPicker.vue';${log}
    const chosen=ref('#123ABC');const accept=next=>{record('managed',next);chosen.value=next};</script><template>${markup((name, code)=>`:${name}="${code}"`, code=>`@value-change='next=>${code}'`,'chosen','disabled')}</template>`,
  svelte: `<script>import ColorPicker from '${ready}/svelte/ColorPicker.svelte';${log}
    let chosen=$state('#123ABC');const accept=next=>{record('managed',next);chosen=next};</script>${markup(jsx,event,'chosen','disabled')}`,
}

if (process.argv[2] === '--ready-fixture') {
  const close = await openReadyDom(process.argv[3])
  try {
    await readyEventually(() => document.querySelectorAll('[data-scope="color-picker"][data-part="root"]').length === 4)
    const input = panel => document.querySelector(`#${panel} input`)
    const swatch = panel => document.querySelector(`#${panel} [data-part="swatch"]`).getAttribute('data-value')
    const preset = (panel, hex) => document.querySelector(`#${panel} button[aria-label="Select ${hex}"]`)
    const received = () => document.querySelector('#events').textContent
    const key = (input, value, key = 'Enter', extras = {}) => {
      input.value = value
      const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...extras })
      input.dispatchEvent(e)
      return e.defaultPrevented
    }
    const local = input('local')
    const fixed = input('fixed')
    const managed = input('managed')
    assert.equal(local.labels[0].textContent, 'Accent')
    assert.equal(new Set(Array.from(document.querySelectorAll('main input'), input => input.id)).size, 4)
    assert.equal(local.value, '#123ABC')
    assert.equal(swatch('local'), '#123ABC')
    assert.equal(document.querySelectorAll('#local button').length, 2)
    assert.equal(preset('local', '#123ABC').getAttribute('aria-pressed'), 'true')

    assert.equal(key(local, '#abcdef', 'Enter', { isComposing: true }), false)
    assert.equal(local.value, '#abcdef')
    assert.equal(received(), '')
    assert.equal(key(local, '#abcdef'), true)
    await readyEventually(() => local.value === '#ABCDEF' && swatch('local') === '#ABCDEF')
    assert.equal(received(), 'local:#ABCDEF;')
    assert.equal(key(local, '#00000080'), true)
    assert.equal(local.value, '#ABCDEF')
    assert.equal(key(local, '#123', 'Escape'), true)
    assert.equal(local.value, '#ABCDEF')
    assert.equal(received(), 'local:#ABCDEF;')

    local.focus()
    local.value = '#123abc'
    local.blur()
    await readyEventually(() => local.value === '#123ABC' && swatch('local') === '#123ABC')
    preset('local', '#BB7700').click()
    await readyEventually(() => local.value === '#BB7700' && swatch('local') === '#BB7700')
    assert.equal(preset('local', '#BB7700').getAttribute('aria-pressed'), 'true')

    assert.equal(key(fixed, '#abcdef'), true)
    assert.equal(fixed.value, '#123ABC')
    preset('fixed', '#BB7700').click()
    await readyEventually(() => received().includes('fixed:#ABCDEF;fixed:#BB7700;'))
    assert.equal(swatch('fixed'), '#123ABC')
    assert.equal(preset('fixed', '#BB7700').getAttribute('aria-pressed'), 'false')

    assert.equal(key(managed, '#fedcba'), true)
    await readyEventually(() => managed.value === '#FEDCBA' && swatch('managed') === '#FEDCBA')
    preset('managed', '#BB7700').click()
    await readyEventually(() => managed.value === '#BB7700' && swatch('managed') === '#BB7700')
    assert.equal(input('disabled').disabled, true)
    assert.equal(preset('disabled', '#BB7700').disabled, true)
    preset('disabled', '#BB7700').click()
    assert.equal(received(), 'local:#ABCDEF;local:#123ABC;local:#BB7700;fixed:#ABCDEF;fixed:#BB7700;managed:#FEDCBA;managed:#BB7700;')
  } finally { await close() }
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready ColorPicker ${framework}: bounded HEX keyboard input, presets, disable and controlled veto`, { timeout: 120_000 }, () =>
      runReadyFixture(root, framework, fixture, fileURLToPath(import.meta.url)))
  }
  test('Ready ColorPicker rejects unsupported precision and alpha in configuration', async () => {
    const { build } = await import('vite')
    const [result] = await build({ root, configFile: false, logLevel: 'error', build: {
      write: false, lib: { entry: `${ready}/ColorPicker.ts`, formats: ['es'], fileName: 'color-picker.mjs' },
    } })
    const source = result.output.find(item => item.type === 'chunk').code
    const { initialColor, colorPickerModel } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
    for (const invalid of ['#000', '#12345678', 'black', 'rgb(0, 0, 0)', '#000000\n']) {
      assert.throws(() => initialColor(invalid), /opaque #RRGGBB/)
      assert.throws(() => colorPickerModel({ label: 'Accent', value: invalid }, '#000000'), /opaque #RRGGBB/)
      assert.throws(() => colorPickerModel({ label: 'Accent', presets: [invalid] }, '#000000'), /opaque #RRGGBB/)
    }
  })
}
