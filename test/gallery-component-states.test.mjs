// Source/cascade regression contracts only. These do not render pixels or prove
// keyboard behavior; the prepared real-browser suite must separately verify that.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import postcss from 'postcss'
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const css = await read('examples/all-components/shared/theme.css')
const tree = postcss.parse(css)
const rules = selector => { const found = []; tree.walkRules(selector, rule => found.push(rule)); return found }
const declaration = (selector, property) => {
  const matching = rules(selector)
  assert.equal(matching.length, 1, `One explicit rule for ${selector}`)
  return matching[0].nodes.findLast(node => node.type === 'decl' && node.prop === property)?.value
}
const checkbox = await read('vendor/shadcn/new-york-v4/ui/checkbox.tsx')
const tabs = await read('vendor/shadcn/new-york-v4/ui/tabs.tsx')
const calendar = await read('vendor/shadcn/new-york-v4/ui/calendar.tsx')

test('generic important focus outline excludes the three explicitly mapped families', () => {
  assert.doesNotMatch(css, /body :focus-visible\s*\{\s*outline: 2px/)
  assert.doesNotMatch(css, /body :is\(button[^}]+outline: 2px/)
  assert.match(css, /body:not\(\.checkbox-basic\):not\(\.tabs-basic\):not\(\.calendar-basic\) :focus-visible/)
})
test('Checkbox disabled parts use half opacity without dimming them again through Root', () => {
  assert.match(checkbox, /disabled:opacity-50/)
  assert.equal(declaration('body.checkbox-basic [data-part="root"][data-disabled]', 'opacity'), '1')
  assert.equal(declaration('body.checkbox-basic [data-part="control"][data-disabled], body.checkbox-basic [data-part="label"][data-disabled]', 'opacity'), '.5')
  assert.equal(declaration('body.checkbox-basic [data-part="label"]', 'color'), 'var(--foreground)')
})
test('invalid Checkbox changes ring color without creating a ring before keyboard focus', () => {
  const invalid = 'body.checkbox-basic [data-part="control"][data-invalid]'
  assert.equal(declaration(invalid, 'border-color'), 'var(--destructive)')
  assert.equal(declaration(invalid, 'box-shadow'), undefined)
  assert.equal(rules(':root[data-theme="dark"] ' + invalid).length, 0)
  assert.match(declaration(invalid + '[data-focus-visible]', 'box-shadow'), /var\(--destructive\) 20%/)
  assert.match(declaration(':root[data-theme="dark"] ' + invalid + '[data-focus-visible]', 'box-shadow'), /var\(--destructive\) 40%/)
})
test('Checkbox focus ring and checked focus border follow the pinned state recipes', () => {
  assert.match(checkbox, /focus-visible:ring-\[3px\]/)
  assert.match(checkbox, /data-\[state=checked\]:border-primary/)
  const focus = 'body.checkbox-basic [data-part="control"][data-focus-visible]'
  assert.equal(declaration(focus, 'border-color'), 'var(--ring)')
  assert.match(declaration(focus, 'box-shadow'), /^0 0 0 3px color-mix\(in oklab, var\(--ring\) 50%, transparent\)/)
  assert.equal(declaration('body.checkbox-basic [data-part="control"][data-state="checked"]:is([data-focus-visible], [data-invalid])', 'border-color'), 'var(--primary)')
})
test('Tabs has disabled pointer protection and dark inactive text, not only opacity', () => {
  assert.match(tabs, /disabled:pointer-events-none disabled:opacity-50/)
  assert.match(tabs, /dark:text-muted-foreground/)
  assert.equal(declaration('body.tabs-basic [data-part="trigger"]:is([data-disabled], :disabled)', 'pointer-events'), 'none')
  assert.equal(declaration(':root[data-theme="dark"] body.tabs-basic [data-part="trigger"]:not([data-selected]):not(:hover)', 'color'), 'var(--muted-foreground)')
})
test('Tabs retains selected shadow underneath its keyboard ring and correct dark border', () => {
  assert.match(tabs, /focus-visible:outline-1 focus-visible:outline-ring/)
  assert.match(tabs, /dark:data-\[state=active\]:border-input/)
  const focus = 'body.tabs-basic [data-part="trigger"]:focus-visible,\n:root[data-theme="dark"] body.tabs-basic [data-part="trigger"]:focus-visible'
  assert.equal(declaration(focus, 'outline'), '1px solid var(--ring)')
  assert.match(declaration(focus, 'box-shadow'), /var\(--parity-tab-shadow\)$/)
  assert.equal(declaration('body.tabs-basic [data-part="trigger"][data-selected]', '--parity-tab-shadow'), 'var(--demo-shadow-sm)')
  assert.equal(declaration(':root[data-theme="dark"] body.tabs-basic [data-part="trigger"][data-selected]:focus-visible', 'border-color'), 'var(--input)')
})
test('Calendar outside dates stay visible and selected outside dates keep selected foreground', () => {
  assert.match(calendar, /showOutsideDays = true/)
  assert.equal(declaration('body.calendar-basic [data-part="table-cell-trigger"][data-outside-range]', 'visibility'), 'visible')
  assert.equal(declaration('body.calendar-basic [data-part="table-cell-trigger"][data-outside-range]:not([data-selected]):not(:hover)', 'color'), 'var(--muted-foreground)')
  assert.equal(rules('body.calendar-basic [data-part="table-cell-trigger"][data-outside-range]:not([data-selected])').length, 0, 'Outside text cannot override the light ghost hover foreground')
})
test('Calendar focused and disabled controls receive explicit reference state styles', () => {
  assert.match(calendar, /group-data-\[focused=true\]\/day:ring-\[3px\]/)
  const focus = 'body.calendar-basic [data-part="table-cell-trigger"]:focus,\nbody.calendar-basic :is([data-part="table-cell-trigger"],[data-part="prev-trigger"],[data-part="next-trigger"]):focus-visible'
  assert.equal(declaration(focus, 'border-color'), 'var(--ring)')
  assert.equal(declaration(focus, 'box-shadow'), '0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent)')
  assert.equal(declaration('body.calendar-basic :is([data-part="table-cell-trigger"],[data-part="prev-trigger"],[data-part="next-trigger"]):is([data-disabled], :disabled, [aria-disabled="true"])', 'opacity'), '.5')
})

test('Calendar focus styling requires DOM focus rather than persistent focusedValue marker', () => {
  const bare = rules('body.calendar-basic [data-part="table-cell-trigger"][data-focus]')
  assert.equal(bare.length, 0)
})

test('forced colors retains explicit focus edges when box shadows disappear', () => {
  const media = tree.nodes.find(node => node.type === 'atrule' && node.name === 'media' && node.params === '(forced-colors: active)')
  assert.ok(media)
  const focus = media.nodes.find(node => node.type === 'rule' && node.selector.includes('body.checkbox-basic [data-part="control"][data-focus-visible]'))
  assert.ok(focus)
  assert.equal(focus.nodes.find(node => node.prop === 'outline').value, '2px solid Highlight')
  assert.equal(focus.nodes.find(node => node.prop === 'outline').important, true)
})
