import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const css = await readFile(new URL('../examples/all-components/shared/theme.css', import.meta.url), 'utf8')
const zinc = await readFile(new URL('../vendor/shadcn/zinc.css', import.meta.url), 'utf8')
// Source contracts, not a substitute for real-browser geometry/visual acceptance.
test('native examples use every pinned Zinc token in both themes', () => {
  for (const declaration of zinc.match(/--[\w-]+:\s*[^;]+;/g)) assert.ok(css.includes(declaration), declaration)
  assert.ok(css.includes(':root[data-theme="dark"]'))
})
test('all frames share the reference canvas dimensions and responsive padding', () => {
  assert.match(css, /min-height: 340px; width: 100%; max-width: none; padding: 32px/)
  assert.match(css, /@media \(max-width: 560px\)[^\n]+padding: 24px 16px/)
  assert.match(css, /justify-content: center; align-items: center; gap: 0/)
})
test('core comparison dimensions and states are adapted, not merely recolored', () => {
  assert.match(css, /body\.checkbox-basic \[data-part="control"\] \{ width: 16px; height: 16px/)
  assert.match(css, /body\.switch-basic \[data-part="control"\] \{ width: 32px; height: 1\.15rem/)
  assert.match(css, /body\.tabs-basic \[data-part="list"\][^\n]+height: 36px; padding: 3px/)
  assert.match(css, /body\.tabs-basic \[data-part="indicator"\] \{ display: none/)
  assert.match(css, /body\.calendar-basic \[data-scope="calendar"\]\[data-part="content"\][^\n]+position: static; width: 248px/)
})
test('safety policies follow the adapters and keep hidden/reduced-motion/high-contrast behavior', () => {
  assert.ok(css.indexOf('@media (prefers-reduced-motion: reduce)') > css.indexOf('Pinned shadcn recipe adapters'))
  assert.ok(css.indexOf('@media (forced-colors: active)') > css.indexOf('Pinned shadcn recipe adapters'))
  assert.match(css, /\[hidden\]:not\(\[hidden="until-found"\]\) \{ display: none !important/)
})
