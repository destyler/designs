import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { openReadyDom, readyEventually, runReadyFixture } from './helpers/ready-browser-fixture.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const ready = `${root}packages/ready`
const markup = (state, intent, change) => `<form>
  <Field label="Full name" name="name" defaultValue="Ada" description="Use your name" required />
  <Field label="Email" name="email" type="email" ${state} ${intent} />
  <Field label="Fixed" name="fixed" readOnly />
  <button type="button" id="update" ${change}>Update</button>
  <span id="proposal"></span>
</form>`
const output = `value => { document.querySelector('#proposal').textContent = value }`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Field} from '${ready}/react';
    function App(){const [active,setActive]=useState(false);return (${markup('value={active ? "accepted@example.org" : "given@example.org"} error={active ? undefined : "Try another address"}', `onValueChange={${output}}`, 'onClick={()=>setActive(true)}')})}
    createRoot(document.getElementById('app')).render(<App/>)`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {Field} from '${ready}/solid';
    function App(){const [active,setActive]=createSignal(false);return (${markup('value={active() ? "accepted@example.org" : "given@example.org"} error={active() ? undefined : "Try another address"}', `onValueChange={${output}}`, 'onClick={()=>setActive(true)}')})}
    render(()=> <App/>,document.getElementById('app'))`,
  vue: `<script setup>import {ref} from 'vue';import {Field} from '${ready}/vue';const active=ref(false);const report=${output}</script><template>${markup(':value="active ? \'accepted@example.org\' : \'given@example.org\'" :error="active ? undefined : \'Try another address\'"', '@update:value="report"', '@click="active=true"').replace('defaultValue=', 'default-value=').replace('readOnly', 'read-only')}</template>`,
  svelte: `<script>import {Field} from '${ready}/svelte';let active=$state(false)</script>${markup('value={active ? "accepted@example.org" : "given@example.org"} error={active ? undefined : "Try another address"}', `onValueChange={${output}}`, 'onclick={()=>active=true}')}`,
}

if (process.argv[2] === '--ready-fixture') {
  const close = await openReadyDom(process.argv[3])
  try {
    await readyEventually(() => document.querySelectorAll('form input').length === 3)
    const [name, email, fixed] = document.querySelectorAll('form input')
    assert.equal(name.labels[0].textContent, 'Full name')
    assert.equal(email.labels[0].textContent, 'Email')
    assert.notEqual(name.id, email.id)
    assert.equal(name.required, true)
    assert.equal(fixed.readOnly, true)
    assert.equal(email.type, 'email')
    assert.equal(document.getElementById(name.getAttribute('aria-describedby')).textContent, 'Use your name')
    assert.equal(document.getElementById(email.getAttribute('aria-describedby')).textContent, 'Try another address')
    assert.equal(email.getAttribute('aria-invalid'), 'true')
    assert.equal(new FormData(name.form).get('name'), 'Ada')
    name.value = 'Grace'
    name.dispatchEvent(new Event('input', { bubbles: true }))
    assert.equal(new FormData(name.form).get('name'), 'Grace')
    name.form.reset()
    assert.equal(new FormData(name.form).get('name'), 'Ada', 'uncontrolled default survives native form reset')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(email, 'proposed@example.org')
    email.dispatchEvent(new Event('input', { bubbles: true }))
    await readyEventually(() => document.querySelector('#proposal').textContent === 'proposed@example.org' &&
      email.value === 'given@example.org', 'controlled field reports the proposal and retains the accepted value')
    document.querySelector('#update').click()
    await readyEventually(() => email.value === 'accepted@example.org' && !email.getAttribute('aria-describedby'))
    assert.notEqual(email.getAttribute('aria-invalid'), 'true')
  } finally { await close() }
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) test(`Ready Field ${framework}: label, descriptions, native form and reactive value`, { timeout: 120_000 }, () =>
    runReadyFixture(root, framework, fixture, fileURLToPath(import.meta.url)))
}
