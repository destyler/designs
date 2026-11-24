import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { openReadyDom, readyEventually, runReadyFixture } from './helpers/ready-browser-fixture.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const ready = `${root}packages/ready`
const markup = (association, update) => `<form>
  <Label ${association}>Receive <strong>updates</strong></Label>
  <input type="checkbox" id="email" name="email" />
  <input type="checkbox" id="text" name="text" />
  <button type="button" id="update" ${update}>Change target</button>
</form>`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Label} from '${ready}/react/Label.tsx';
    function App(){const [target,setTarget]=useState('email');return (${markup('htmlFor={target}', 'onClick={()=>setTarget("text")}')})}
    createRoot(document.getElementById('app')).render(<App/>)`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {Label} from '${ready}/solid/Label.tsx';
    function App(){const [target,setTarget]=createSignal('email');return (${markup('for={target()}', 'onClick={()=>setTarget("text")}')})}
    render(()=> <App/>,document.getElementById('app'))`,
  vue: `<script setup>import {ref} from 'vue';import Label from '${ready}/vue/Label.vue';const target=ref('email')</script><template>${markup(':for="target"', '@click="target=\'text\'"')}</template>`,
  svelte: `<script>import Label from '${ready}/svelte/Label.svelte';let target=$state('email')</script>${markup('for={target}', 'onclick={()=>target="text"}')}`,
}

if (process.argv[2] === '--ready-fixture') {
  const close = await openReadyDom(process.argv[3])
  try {
    await readyEventually(() => document.querySelector('label'))
    const [label] = document.querySelectorAll('label')
    const email = document.getElementById('email')
    const text = document.getElementById('text')
    const form = document.querySelector('form')
    const clicks = { email: 0, text: 0 }
    for (const input of [email, text]) input.addEventListener('click', () => clicks[input.id]++)

    assert.ok(label.matches('label.rd-component[data-scope="label"][data-part="root"]'))
    assert.equal(label.textContent, 'Receive updates')
    assert.equal(label.querySelector('strong')?.textContent, 'updates')
    assert.equal(label.hasAttribute('tabindex'), false)
    assert.equal(label.control, email)
    assert.deepEqual(Array.from(email.labels), [label])
    assert.equal(text.labels.length, 0)
    assert.deepEqual(Array.from(new FormData(form).keys()), [])

    label.click()
    assert.equal(email.checked, true)
    assert.equal(text.checked, false)
    assert.deepEqual(clicks, { email: 1, text: 0 })
    assert.deepEqual(Array.from(new FormData(form).keys()), ['email'])

    document.getElementById('update').click()
    await readyEventually(() => label.control === text, 'existing label retargets the other control')
    assert.equal(document.querySelector('label'), label)
    assert.equal(email.labels.length, 0)
    assert.deepEqual(Array.from(text.labels), [label])

    label.click()
    assert.equal(email.checked, true)
    assert.equal(text.checked, true)
    assert.deepEqual(clicks, { email: 1, text: 1 })
    assert.deepEqual(Array.from(new FormData(form).keys()), ['email', 'text'])
  } finally {
    await close()
  }
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Label ${framework}: native association activates exactly the current control`, { timeout: 120_000 }, () =>
      runReadyFixture(root, framework, fixture, fileURLToPath(import.meta.url)))
  }
}
