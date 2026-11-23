import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { openReadyDom, readyEventually, runReadyFixture } from './helpers/ready-browser-fixture.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const worker = fileURLToPath(import.meta.url)
const common = "label='Travel dates' defaultValue='2026-06-16' min='2026-06-01' max='2026-07-31'"
const dates = "['2026-06-17']"
const jsx = framework => `import { Calendar } from '../../packages/ready/${framework}/Calendar';
${framework === 'react' ? "import React from 'react';import {createRoot} from 'react-dom/client'; const mount = (node) => createRoot(document.querySelector('#app')).render(node);" : "import {render} from 'solid-js/web'; const mount = (node) => render(node, document.querySelector('#app'));"}
window.picks = []; window.fixedPicks = []; const record = value => window.picks.push(value);
mount(${framework === 'solid' ? '() => ' : ''}<form><Calendar ${common} disabledDates={${dates}} onValueChange={record} /><Calendar label="Fixed dates" value="2026-06-16" disabledDates={[]} onValueChange={value => window.fixedPicks.push(value)} /></form>);`
const fixtures = {
  react: jsx('react'),
  solid: jsx('solid'),
  vue: `<script setup>
    import Calendar from '../../packages/ready/vue/Calendar.vue'; window.picks = []; window.fixedPicks = []; const record = value => window.picks.push(value); const recordFixed = value => window.fixedPicks.push(value);
    </script><template><form><Calendar ${common.replace('defaultValue', 'default-value')} :disabled-dates="${dates}" @value-change="record" /><Calendar label="Fixed dates" value="2026-06-16" @value-change="recordFixed" /></form></template>`,
  svelte: `<script>
    import Calendar from '../../packages/ready/svelte/Calendar.svelte'; window.picks = []; window.fixedPicks = []; const record = value => window.picks.push(value);
    </script><form><Calendar ${common} disabledDates={${dates}} onValueChange={record} /><Calendar label="Fixed dates" value="2026-06-16" onValueChange={value => window.fixedPicks.push(value)} /></form>`,
}

if (process.argv[2] === '--ready-fixture') {
  const close = await openReadyDom(process.argv[3])
  try {
    const grid = () => document.querySelector('[role="grid"][aria-label="Travel dates"]')
    const date = iso => grid()?.querySelector(`button[data-part="table-cell-trigger"][data-value="${iso}"]`)
    const cell = iso => date(iso)?.closest('[role="gridcell"]')
    const key = (node, key) => node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    await readyEventually(() => date('2026-06-16')?.getAttribute('data-selected') !== null && !!date('2026-06-17'), 'calendar grid renders actual buttons')
    assert.equal(cell('2026-06-16').getAttribute('aria-selected'), 'true')
    assert.equal(date('2026-06-16').type, 'button')
    assert.equal(date('2026-06-17').getAttribute('aria-disabled'), 'true')
    assert.equal(date('2026-06-17').tabIndex, -1)
    date('2026-06-17').click()
    assert.deepEqual(window.picks, [])
    date('2026-06-16').focus()
    key(date('2026-06-16'), 'ArrowRight')
    await readyEventually(() => date('2026-06-17').tabIndex === 0, 'disabled date is the actual roving focus so Enter reaches the reported edge case')
    await readyEventually(() => document.activeElement === date('2026-06-17'), 'disabled date receives keyboard focus')
    assert.equal(key(date('2026-06-17'), 'Enter'), false, 'capture cancels disabled Enter before the table machine can select')
    assert.equal(key(date('2026-06-17'), ' '), false, 'capture cancels native space activation on disabled dates')
    await new Promise(resolve => setTimeout(resolve, 30))
    assert.deepEqual(window.picks, [])
    assert.equal(cell('2026-06-17').getAttribute('aria-selected'), 'false')
    assert.equal(cell('2026-06-16').getAttribute('aria-selected'), 'true')
    key(date('2026-06-17'), 'ArrowRight')
    await readyEventually(() => document.activeElement === date('2026-06-18'), 'arrow keys still move from disabled dates')
    key(date('2026-06-18'), 'Enter')
    await readyEventually(() => cell('2026-06-18').getAttribute('aria-selected') === 'true', 'enabled Enter selects')
    assert.deepEqual(window.picks, ['2026-06-18'])
    date('2026-06-19').click()
    await readyEventually(() => cell('2026-06-19').getAttribute('aria-selected') === 'true', 'enabled click selects')
    assert.deepEqual(window.picks, ['2026-06-18', '2026-06-19'])
    assert.equal(document.querySelector('[data-part="prev-trigger"]').disabled, true)
    document.querySelector('[data-part="next-trigger"]').click()
    await readyEventually(() => date('2026-07-15'), 'next month renders')
    assert.equal(document.querySelector('[data-part="next-trigger"]').disabled, true)
    assert.equal(document.querySelector('[data-part="prev-trigger"]').disabled, false)
    const fixed = iso => document.querySelector(`[role="grid"][aria-label="Fixed dates"] button[data-value="${iso}"]`)
    fixed('2026-06-20').click()
    await readyEventually(() => window.fixedPicks.length === 1, 'controlled Calendar reports proposed value')
    assert.deepEqual(window.fixedPicks, ['2026-06-20'])
    assert.equal(fixed('2026-06-16').closest('[role="gridcell"]').getAttribute('aria-selected'), 'true', 'controlled veto retains previous selection')
    assert.equal(fixed('2026-06-20').closest('[role="gridcell"]').getAttribute('aria-selected'), 'false')
    const ids = [...document.querySelectorAll('[data-scope="calendar"][id]')].map(node => node.id)
    assert.equal(new Set(ids).size, ids.length, 'two calendar instances have independent element IDs')
  } finally {
    await close()
  }
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Calendar ${framework}: blocked day activation, roving focus and bounded month navigation`, async () => {
      await runReadyFixture(root, framework, fixture, worker)
    })
  }
}
