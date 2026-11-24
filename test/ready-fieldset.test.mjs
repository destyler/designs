import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { openReadyDom, readyEventually, runReadyFixture } from './helpers/ready-browser-fixture.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const ready = `${root}packages/ready`
const markup = (description, disabled, button) => `<form>
  <button type="button" id="update" ${button}>Change settings</button>
  <Fieldset legend="Profile" ${description} ${disabled}><input name="name" value="A" /></Fieldset>
  <Fieldset legend="Contact" description="   "><input name="city" value="Hangzhou" /></Fieldset>
</form>`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Fieldset} from '${ready}/react';
    function App(){const [active,setActive]=useState(false);return (${markup('description={active ? "" : "Required details"}', 'disabled={active}', 'onClick={()=>setActive(true)}')})}
    createRoot(document.getElementById('app')).render(<App/>)`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {Fieldset} from '${ready}/solid';
    function App(){const [active,setActive]=createSignal(false);return (${markup('description={active() ? "" : "Required details"}', 'disabled={active()}', 'onClick={()=>setActive(true)}')})}
    render(()=> <App/>,document.getElementById('app'))`,
  vue: `<script setup>import {ref} from 'vue';import {Fieldset} from '${ready}/vue';const active=ref(false)</script><template>${markup(':description="active ? \'\' : \'Required details\'"', ':disabled="active"', '@click="active=true"')}</template>`,
  svelte: `<script>import {Fieldset} from '${ready}/svelte';let active=$state(false)</script>${markup('description={active ? "" : "Required details"}', 'disabled={active}', 'onclick={()=>active=true}')}`,
}

if (process.argv[2] === '--ready-fixture') {
  const close = await openReadyDom(process.argv[3])
  try {
    await readyEventually(() => document.querySelectorAll('fieldset').length === 2)
    const [profile, contact] = document.querySelectorAll('fieldset')
    assert.equal(profile.firstElementChild.tagName, 'LEGEND')
    assert.equal(profile.firstElementChild.textContent, 'Profile')
    assert.equal(contact.firstElementChild.textContent, 'Contact')
    const id = profile.getAttribute('aria-describedby')
    assert.equal(document.getElementById(id)?.textContent, 'Required details')
    assert.equal(contact.hasAttribute('aria-describedby'), false)
    assert.equal(profile.querySelector('input').name, 'name')
    assert.equal(profile.disabled, false)
    document.querySelector('#update').click()
    await readyEventually(() => profile.disabled && !profile.hasAttribute('aria-describedby'))
    assert.equal(document.getElementById(id), null)
    assert.equal(contact.disabled, false)
  } finally { await close() }
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) test(`Ready Fieldset ${framework}: native group, disabled and description`, { timeout: 120_000 }, () =>
    runReadyFixture(root, framework, fixture, fileURLToPath(import.meta.url)))
}
