import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { openReadyDom, readyEventually, runReadyFixture } from './helpers/ready-browser-fixture.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const ready = `${root}packages/ready`
const markup = (attrs, action) => `<main>
  <button type="button" id="switch-axis" ${action}>Switch axis</button>
  <ScrollArea label="Activity" ${attrs}><a href="#details">Read details</a></ScrollArea>
  <ScrollArea label="Results"><span>Some content</span></ScrollArea>
</main>`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {ScrollArea} from '${ready}/react';
    function Demo(){const [changed,setChanged]=useState(false);return (${markup('maxHeight={changed ? 200 : 150} orientation={changed ? "horizontal" : "both"}', 'onClick={()=>setChanged(true)}')})}
    createRoot(document.getElementById('app')).render(<Demo/>)`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {ScrollArea} from '${ready}/solid';
    function Demo(){const [changed,setChanged]=createSignal(false);return (${markup('maxHeight={changed() ? 200 : 150} orientation={changed() ? "horizontal" : "both"}', 'onClick={()=>setChanged(true)}')})}
    render(()=> <Demo/>,document.getElementById('app'))`,
  vue: `<script setup>import {ref} from 'vue';import {ScrollArea} from '${ready}/vue';const changed=ref(false)</script><template>${markup(':max-height="changed ? 200 : 150" :orientation="changed ? \'horizontal\' : \'both\'"', '@click="changed=true"')}</template>`,
  svelte: `<script>import {ScrollArea} from '${ready}/svelte';let changed=$state(false)</script>${markup('maxHeight={changed ? 200 : 150} orientation={changed ? "horizontal" : "both"}', 'onclick={()=>changed=true}')}`,
}

if (process.argv[2] === '--ready-fixture') {
  const close = await openReadyDom(process.argv[3])
  try {
    const regions = () => [...document.querySelectorAll('[role=region]')]
    await readyEventually(() => regions().length === 2)
    const [activity, results] = regions()
    assert.notEqual(activity.id, results.id)
    assert.equal(activity.dataset.scope, 'scroll-area')
    assert.equal(activity.dataset.part, 'viewport')
    assert.equal(activity.getAttribute('aria-label'), 'Activity')
    assert.equal(activity.tabIndex, 0)
    assert.equal(activity.style.height, 'auto')
    assert.equal(activity.style.maxHeight, '150px')
    assert.equal(activity.style.overflowX, 'auto')
    assert.equal(activity.style.overflowY, 'auto')
    assert.equal(activity.style.getPropertyValue('scrollbar-width'), 'auto')
    assert.equal(results.style.maxHeight, '320px')
    assert.equal(results.style.overflowX, 'hidden')
    assert.equal(results.style.overflowY, 'auto')
    assert.equal(activity.querySelector('[data-part=content] a').getAttribute('href'), '#details')
    assert.equal(document.querySelector('[role=scrollbar]'), null, 'native scrollbars, not imitation ARIA controls')
    activity.focus()
    assert.equal(document.activeElement, activity)
    document.querySelector('#switch-axis').click()
    await readyEventually(() => activity.style.overflowY === 'hidden' && activity.style.maxHeight === '200px')
    assert.equal(activity.style.overflowX, 'auto')
    assert.equal(regions()[0], activity, 'changes preserve focus target and nodes')
    assert.equal(document.activeElement, activity)
  } finally { await close() }
} else {
  test('Ready ScrollArea validates its name, height and axis', async () => {
    const { scrollAreaOptions } = await import('../packages/ready/ScrollArea.ts')
    assert.throws(() => scrollAreaOptions({ label: ' ' }), /label/)
    assert.throws(() => scrollAreaOptions({ label: 'Activity', maxHeight: 0 }), /maxHeight/)
    assert.throws(() => scrollAreaOptions({ label: 'Activity', maxHeight: Infinity }), /maxHeight/)
    assert.throws(() => scrollAreaOptions({ label: 'Activity', orientation: 'invalid' }), /orientation/)
  })
  for (const [framework, fixture] of Object.entries(fixtures)) test(`Ready ScrollArea ${framework}: focus, native scrolling props and dynamic axes`, { timeout: 120_000 }, () =>
    runReadyFixture(root, framework, fixture, fileURLToPath(import.meta.url)))
}
