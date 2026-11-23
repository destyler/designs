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
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const { run } = await import(pathToFileURL(process.argv[3]))
  const settle = () => new Promise(resolve => setTimeout(resolve, 65))
  for (const controlled of [false, true]) {
    const form = document.createElement('form')
    document.body.append(form)
    const changes = []
    const dispose = run(form, { label: 'Verification code', name: 'otp', length: 4, defaultValue: ['1'],
      ...(controlled ? { value: ['9', '0', '7', '8'], mask: true } : {}), required: true,
      onValueChange: digits => changes.push(digits) })
    await settle()
    const group = form.querySelector('[role=group]')
    assert.equal(document.getElementById(group.getAttribute('aria-labelledby')).textContent, 'Verification code')
    const inputs = [...group.querySelectorAll('[data-part=input]')]
    const values = () => inputs.map(input => input.value)
    const serialized = () => [...new win.FormData(form)]
    assert.equal(inputs.length, 4)
    for (const [index, input] of inputs.entries()) {
      assert.equal(input.name, '')
      assert.equal(input.required, true)
      assert.equal(input.getAttribute('aria-label'), `Verification code (${index + 1}/4)`)
      assert.equal(input.autocomplete, index === 0 ? 'one-time-code' : 'off')
      assert.equal(input.type, controlled ? 'password' : 'tel')
    }
    assert.equal(form.querySelectorAll('input[type=hidden]').length, 1)
    assert.deepEqual(values(), controlled ? ['9', '0', '7', '8'] : ['1', '', '', ''])
    assert.deepEqual(serialized(), controlled ? [['otp', '9078']] : [])
    if (!controlled) assert.equal(form.checkValidity(), false)
    const sendPaste = (index, text) => {
      inputs[index].focus()
      const event = new win.Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } })
      assert.equal(inputs[index].dispatchEvent(event), false)
    }
    sendPaste(1, '0x1')
    await settle()
    assert.deepEqual(changes, [])
    sendPaste(1, ' 2308 ')
    await settle()
    assert.deepEqual(changes, [[controlled ? '9' : '1', '2', '3', '0']])
    assert.deepEqual(values(), controlled ? ['9', '0', '7', '8'] : ['1', '2', '3', '0'])
    assert.deepEqual(serialized(), controlled ? [['otp', '9078']] : [['otp', '1230']])
    assert.equal(form.checkValidity(), true)
    if (controlled) {
      inputs[1].focus()
      inputs[1].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }))
      await settle()
      assert.deepEqual(changes[1], ['9', '', '7', '8'])
      assert.deepEqual(values(), ['9', '0', '7', '8'])
      assert.deepEqual(serialized(), [['otp', '9078']])
    }
    form.addEventListener('reset', event => event.preventDefault(), { once: true })
    form.reset()
    await settle()
    assert.deepEqual(serialized(), controlled ? [['otp', '9078']] : [['otp', '1230']])
    form.reset()
    await settle()
    assert.deepEqual(values(), controlled ? ['9', '0', '7', '8'] : ['1', '', '', ''])
    assert.deepEqual(serialized(), controlled ? [['otp', '9078']] : [])
    assert.equal(changes.length, controlled ? 2 : 1, 'reset does not emit input proposals')
    await dispose()
    form.remove()
  }
  const disabledForm = document.createElement('form')
  document.body.append(disabledForm)
  const dispose = run(disabledForm, { label: 'Disabled code', name: 'otp', length: 2, value: ['0', '5'], required: true, disabled: true, onValueChange() { assert.fail('disabled OTP emitted a value') } })
  await settle()
  assert.equal(disabledForm.querySelectorAll('input:disabled').length, 3)
  assert.equal(disabledForm.querySelector('input[type=hidden]').value, '')
  assert.deepEqual([...new win.FormData(disabledForm)], [])
  assert.equal(disabledForm.checkValidity(), true)
  await dispose()
  disabledForm.remove()
  await win.happyDOM.close()
  console.log('PASS Ready OTPInput')
} else {
  test('Ready OTPInput validates positional numeric values', async () => {
    const { otpDigitCount, otpDigits, otpLabel } = await import('../packages/ready/OTPInput.ts')
    assert.equal(otpDigitCount(), 6)
    assert.throws(() => otpDigitCount(0), /length/)
    assert.throws(() => otpLabel(' '), /label/)
    assert.throws(() => otpDigits(2, ['12']), /single ASCII/)
    assert.throws(() => otpDigits(2, [2]), /single ASCII/)
    assert.throws(() => otpDigits(2, ['1', '2', '3']), /up to length/)
    assert.deepEqual(otpDigits(4, ['0', '', '2']), ['0', '', '2', ''])
  })
  for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} OTPInput: numeric paste, form ownership and reset`, { timeout: 120000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-otpinput-'))
    try {
      const source = `${root}packages/ready/${framework}/OTPInput.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
      let plugin, code
      if (framework === 'react') {
        plugin = (await import('@vitejs/plugin-react')).default()
        code = `import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {OTPInput} from '${source}';export function run(target, props){const root=createRoot(target);root.render(h(OTPInput,props));return()=>root.unmount()}`
      } else if (framework === 'solid') {
        plugin = (await import('vite-plugin-solid')).default()
        code = `import {render} from 'solid-js/web';import {OTPInput} from '${source}';export function run(target,props){return render(()=><OTPInput {...props}/>,target)}`
      } else if (framework === 'vue') {
        plugin = (await import('@vitejs/plugin-vue')).default()
        code = `import {createApp,h} from 'vue';import OTPInput from '${source}';export function run(target,props){const app=createApp({render:()=>h(OTPInput,props)});app.mount(target);return()=>app.unmount()}`
      } else {
        plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
        code = `import {mount,unmount} from 'svelte';import OTPInput from '${source}';export function run(target,props){const app=mount(OTPInput,{target,props});return()=>unmount(app)}`
      }
      const entry = join(folder, 'entry.tsx')
      await writeFile(entry, code)
      const { build } = await import('vite')
      await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
      assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready OTPInput/)
    } finally { await rm(folder, { recursive: true, force: true }) }
  })
}
