import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import postcss from 'postcss'

const shared = await readFile(new URL('../examples/all-components/shared/theme.css', import.meta.url), 'utf8')
const dedicated = await readFile(new URL('../examples/all-components/shared/css-only-gallery.css', import.meta.url), 'utf8')
const sharedTree = postcss.parse(shared)
const dedicatedTree = postcss.parse(dedicated)
const rules = (tree, selector) => {
  const found = []
  tree.walkRules(selector, rule => found.push(rule))
  return found
}
const value = (rule, prop) => rule.nodes.findLast(node => node.type === 'decl' && node.prop === prop)?.value

// These are cascade/source contracts. They do not assert pixels, focus behavior
// or native dropdown rendering without a real browser.
test('Basic rules are lower-layer fallbacks rather than competing unlayered recipes', () => {
  const basic = rules(sharedTree, '.combobox-basic [data-scope="combobox"][data-part="input"]')[0]
  assert.equal(basic.parent.name, 'layer')
  assert.equal(basic.parent.params, 'gallery-base')
  const adapted = rules(sharedTree, 'body.combobox-basic [data-part="input"], body.select-basic [data-scope="select"][data-part="trigger"]')[0]
  assert.equal(adapted.parent.type, 'root')
  assert.equal(value(adapted, 'height'), '36px')
})
test('the dedicated two-family sheet imports the existing package after a lower reset layer', () => {
  assert.equal(dedicatedTree.nodes.find(node => node.type === 'atrule' && node.name === 'import').params, '"../../../packages/css-only/styles.css"')
  assert.equal(dedicatedTree.nodes.find(node => node.type === 'atrule' && node.name === 'layer').params, 'gallery-reset, destyler')
  assert.doesNotMatch(dedicated, /\[data-part="thumb"\]/)
  assert.doesNotMatch(dedicated, /justify-content:\s*flex-end[^}]+translate/)
})
test('dark outline buttons have at least the base selector specificity and retain hover state', () => {
  const base = 'body[class$="-basic"] .parity-button.parity-button'
  const dark = rules(sharedTree, `:root[data-theme="dark"] ${base}`)[0]
  assert.equal(value(dark, 'background'), 'color-mix(in oklab, var(--input) 30%, transparent)')
  const hover = rules(sharedTree, `:root[data-theme="dark"] ${base}:hover`)[0]
  assert.equal(value(hover, 'background'), 'color-mix(in oklab, var(--input) 50%, transparent)')
})
test('comparison wrapper and Slider label use the same centered and default-text layout', () => {
  assert.equal(value(rules(sharedTree, 'body[class$="-basic"] .ds-example-content')[0], 'align-items'), 'center')
  const label = rules(sharedTree, 'body.slider-basic [data-part="label"]')[0]
  assert.equal(value(label, 'font-size'), '16px')
  assert.equal(value(label, 'font-weight'), '400')
  assert.equal(value(label, 'line-height'), '24px')
})
test('Calendar uses a native transparent select over the visible reference-like caption', () => {
  const select = rules(sharedTree, 'body.calendar-basic .parity-calendar-dropdown select')[0]
  assert.equal(value(select, 'position'), 'absolute')
  assert.equal(value(select, 'opacity'), '0')
  assert.equal(value(select, 'width'), '100%')
  const label = rules(sharedTree, 'body.calendar-basic .parity-calendar-caption-label')[0]
  assert.equal(value(label, 'pointer-events'), 'none')
})

test('Tabs light selected background is not overwritten by a dark-only recipe', () => {
  const light = rules(sharedTree, 'body.tabs-basic [data-part="trigger"][data-selected]')
  assert.equal(light.length, 1)
  assert.equal(value(light[0], 'background'), 'var(--background)')
  const dark = rules(sharedTree, ':root[data-theme="dark"] body.tabs-basic [data-part="trigger"][data-selected]')
  assert.equal(dark.length, 1)
  assert.equal(value(dark[0], 'background'), 'color-mix(in oklab, var(--input) 30%, transparent)')
})
