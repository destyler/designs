import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Window } from 'happy-dom'
import { handleOptionalSelection, boundaryCell } from '../examples/all-components/react/calendar-compat.ts'

// Pure adapter contracts; the aggregate executes real framework compositions.
test('Calendar compatibility helpers remain identical and app-local in all frameworks', async () => {
  const sources = await Promise.all(['react', 'vue', 'solid', 'svelte'].map(framework => readFile(new URL(`../examples/all-components/${framework}/calendar-compat.ts`, import.meta.url), 'utf8')))
  for (const source of sources) assert.equal(source, sources[0])
})
test('Calendar bounds preserve leading blank cells and omit trailing out-of-range cells', () => {
  for (const [year, expected] of [[2019, 'hidden'], [2020, 'day'], [2030, 'day'], [2031, 'omitted']]) assert.equal(boundaryCell({ year }), expected)
})
test('Optional selection respects cancellation, availability, non-day controls and repeat keys', () => {
  const win = new Window(); globalThis.Element = win.Element
  const target = win.document.createElement('div')
  target.setAttribute('data-scope', 'calendar'); target.setAttribute('data-part', 'table-cell-trigger'); target.setAttribute('data-view', 'day'); target.setAttribute('data-value', '2026-11-15')
  const day = { year: 2026, toString: () => '2026-11-15' }
  let clears = 0, allowed = true
  const api = { value: [day], setValue: values => { assert.deepEqual(values, []); clears++ }, getDayTableCellState: () => ({ selectable: allowed }) }
  function event(extra = {}) { return { target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, ...extra } }
  for (const extra of [{ defaultPrevented: true }, { key: 'ArrowRight' }, { button: 2 }]) handleOptionalSelection(event(extra), api)
  allowed = false; handleOptionalSelection(event(), api); allowed = true
  handleOptionalSelection(event({ target: win.document.createElement('select') }), api)
  assert.equal(clears, 0)
  for (const extra of [{}, { key: 'Enter' }, { key: ' ' }]) { const e = event(extra); handleOptionalSelection(e, api); assert.equal(e.defaultPrevented, true) }
  assert.equal(clears, 3)
  const repeat = event({ key: 'Enter', repeat: true }); handleOptionalSelection(repeat, { ...api, value: [] }); assert.equal(repeat.defaultPrevented, true); assert.equal(clears, 3)
  const unselected = event(); handleOptionalSelection(unselected, { ...api, value: [] }); assert.equal(unselected.defaultPrevented, false)
  delete globalThis.Element
})
