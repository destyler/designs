import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { families, frameworks, themes, viewports, targetUrl, styleDifferences, resultStatus } from '../scripts/lib/gallery-browser-contract.mjs'

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
