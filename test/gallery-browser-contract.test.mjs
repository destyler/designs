import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { families, frameworks, themes, viewports, targetUrl, styleDifferences, resultStatus, styleKeys, requiredStates, disabledCoverage, missingStates, calendarControlNames, calendarMonthValue } from '../scripts/lib/gallery-browser-contract.mjs'

test('Calendar locators accept actual framework labels and respect native option values', async () => {
  for (const [framework, path] of Object.entries({ react: 'components/calendar/Basic.tsx', vue: 'calendar/Basic.vue', solid: 'components/calendar/Basic.tsx', svelte: 'calendar.svelte' })) {
    const source = await readFile(new URL(`../examples/all-components/${framework}/${path}`, import.meta.url), 'utf8')
    const labels = [...source.matchAll(/aria-label="([^"]+)"/g)].map(match => match[1])
    for (const name of Object.values(calendarControlNames)) assert.equal(labels.filter(label => name.test(label)).length, 1, framework)
  }
  assert.ok(calendarControlNames.month.test('Choose the Month'))
  assert.ok(calendarControlNames.year.test('Choose the Year'))
  assert.equal(calendarMonthValue(12, true), '11')
  assert.equal(calendarMonthValue(12, false), '12')
  assert.equal(calendarMonthValue(1, true), '0')
  assert.equal(calendarMonthValue(1, false), '1')
  for (const month of [0, 13, 1.5, '12']) assert.throws(() => calendarMonthValue(month, false))
  const runner = await readFile(new URL('../scripts/test-all-components-browser.mjs', import.meta.url), 'utf8')
  assert.match(runner, /getByLabel\(calendarControlNames\.month\)/)
  assert.match(runner, /selectOption\(\{ value: calendarMonthValue\(12, reference\)/)
  assert.doesNotMatch(runner, /selectOption\(\{ label: '(?:Nov|Dec)'/)
  assert.ok(runner.includes(`frame.locator('p[role="status"]')`), 'Calendar feedback must exclude DayPicker’s separate month-announcement status')
  assert.doesNotMatch(runner, /frame\.getByRole\('status'\)/)
})

test('planned gallery coverage is 60 actual frame cases', () => {
  assert.deepEqual(families, ['checkbox', 'tabs', 'calendar'])
  assert.deepEqual(frameworks, ['shadcn', 'react', 'vue', 'solid', 'svelte'])
  assert.equal(families.length * frameworks.length * themes.length * viewports.length, 60)
  assert.equal(targetUrl('https://preview.example', 'calendar'), 'https://preview.example/components/#calendar')
})
test('explicit target origin cannot silently carry credentials or an unrelated path', () => {
  for (const value of ['file:///tmp/index.html', 'https://user:secret@example.com', 'https://example.com/old', 'https://example.com/?token=x']) assert.throws(() => targetUrl(value, 'tabs'))
})
test('style comparisons preserve exact non-geometry differences and bound px tolerance', () => {
  assert.deepEqual(styleDifferences({ width: '16px' }, { width: '16.4px' }), [])
  assert.equal(styleDifferences({ width: '16px' }, { width: '17px' }).length, 1)
  assert.equal(styleDifferences({ color: '1,2,3,255' }, { color: '1,2,4,255' }).length, 1)
  assert.equal(styleDifferences({ fontWeight: '500' }, { fontWeight: '400' }).length, 1)
  assert.equal(styleDifferences({ padding: '4px' }, {}).length, 1)
})
test('no cases, mismatches or launch errors cannot become a passing report', () => {
  assert.equal(resultStatus([]), 'failed')
  assert.equal(resultStatus([{ pass: true }, { pass: false }]), 'failed')
  assert.equal(resultStatus([{ pass: true }], 'launch denied'), 'blocked')
  assert.equal(resultStatus([{ pass: true }]), 'passed')
})
test('runner targets real gallery iframes, requires explicit opt-in and has no browser workaround', async () => {
  const source = await readFile(new URL('../scripts/test-all-components-browser.mjs', import.meta.url), 'utf8')
  assert.match(source, /RUN_BROWSER_ACCEPTANCE !== '1'/)
  assert.match(source, /\.contentFrame\(\)/)
  assert.match(source, /gallery-frame-status/)
  assert.match(source, /report\.cases\.length === 60/)
  assert.doesNotMatch(source, /--no-sandbox|ignoreHTTPSErrors|\/css-only\/|bypass.*[Ss]ecret/)
  assert.ok(source.indexOf("RUN_BROWSER_ACCEPTANCE !== '1'") < source.indexOf("await import('playwright')"))
})

test('state measurements include every border side and observable disabled/focus styles', () => {
  for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
    for (const field of ['Color', 'Width', 'Style']) assert.ok(styleKeys.includes(`border${side}${field}`))
    assert.equal(styleDifferences({ [`border${side}Color`]: '10,20,30,255' }, { [`border${side}Color`]: '10,20,31,255' }).length, 1)
  }
  for (const key of ['opacity', 'pointerEvents', 'outlineOffset', 'outlineColor', 'boxShadow']) assert.ok(styleKeys.includes(key))
})
test('missing selected or focus measurements cannot satisfy the coverage contract', () => {
  for (const family of families) {
    const full = Object.fromEntries(requiredStates[family].map(state => [state, { part: {} }]))
    assert.deepEqual(missingStates(family, full), [])
    assert.ok(requiredStates[family].some(state => /keyboard-focus|focused-unselected/.test(state)))
    const [first] = requiredStates[family]
    delete full[first]
    assert.deepEqual(missingStates(family, full), [first])
  }
  assert.ok(requiredStates.tabs.includes('disabled'))
  assert.match(disabledCoverage.tabs, /^actual-fixture:/)
  assert.match(disabledCoverage.checkbox, /^not-covered:/)
  assert.match(disabledCoverage.calendar, /^not-covered:/)
})
test('runner compares every measured state to successful reference states without faking disabled props', async () => {
  const source = await readFile(new URL('../scripts/test-all-components-browser.mjs', import.meta.url), 'utf8')
  assert.match(source, /for \(const state of requiredStates\[family\]\)/)
  assert.match(source, /missingStates\(family, referenceCase.stateStyles\)/)
  assert.match(source, /data-selected-single/)
  assert.match(source, /el.matches\(':focus-visible'\)/)
  assert.match(source, /capture\('disabled', \{ tab: tab\('Svelte'\) \}\)/)
  assert.doesNotMatch(source, /setAttribute\(['"](?:disabled|data-disabled)|\.disabled\s*=|dispatchEvent\(/)
})
