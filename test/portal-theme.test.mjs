import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { bindPortalTheme, themeTokens } from '../src/portal-theme.js'

function element() {
  const attrs = new Map(), values = new Map(), priorities = new Map()
  return {
    contains: () => false,
    getAttribute: name => attrs.get(name) ?? null,
    setAttribute: (name, value) => attrs.set(name, value),
    removeAttribute: name => attrs.delete(name),
    style: {
      getPropertyValue: name => values.get(name) ?? '',
      getPropertyPriority: name => priorities.get(name) ?? '',
      setProperty(name, value, priority = '') { values.set(name, value); priorities.set(name, priority) },
      removeProperty(name) { values.delete(name); priorities.delete(name) },
    },
  }
}
const options = { getStyle: source => source.style, Observer: null }

test('copies computed local overrides and only public theme tokens', () => {
  const source = element(), portal = element()
  source.setAttribute('data-skin', 'ember')
  source.setAttribute('data-theme', 'dark')
  source.style.setProperty('--ds-accent', ' #123456 ')
  source.style.setProperty('--private-token', 'private')
  bindPortalTheme(source, portal, options)
  assert.equal(portal.getAttribute('data-theme-root'), '')
  assert.equal(portal.getAttribute('data-skin'), 'ember')
  assert.equal(portal.style.getPropertyValue('--ds-accent'), '#123456')
  assert.equal(portal.style.getPropertyValue('--private-token'), '')
})
test('two roots remain independent and stale values are removed on sync', () => {
  const a = element(), b = element(), pa = element(), pb = element()
  a.style.setProperty('--ds-accent', 'red'); b.style.setProperty('--ds-accent', 'blue')
  const binding = bindPortalTheme(a, pa, options)
  bindPortalTheme(b, pb, options)
  a.setAttribute('data-theme', 'dark'); a.style.removeProperty('--ds-accent')
  binding.sync()
  assert.equal(pa.getAttribute('data-theme'), 'dark')
  assert.equal(pa.style.getPropertyValue('--ds-accent'), '')
  assert.equal(pb.style.getPropertyValue('--ds-accent'), 'blue')
  assert.equal(pb.getAttribute('data-theme'), null)
})
test('dispose restores original attributes and priorities, is idempotent', () => {
  const source = element(), portal = element()
  portal.setAttribute('data-theme', 'original')
  portal.style.setProperty('--ds-accent', 'pink', 'important')
  const binding = bindPortalTheme(source, portal, options)
  binding.dispose(); binding.dispose(); binding.sync()
  assert.equal(portal.getAttribute('data-theme'), 'original')
  assert.equal(portal.getAttribute('data-theme-root'), null)
  assert.equal(portal.style.getPropertyValue('--ds-accent'), 'pink')
  assert.equal(portal.style.getPropertyPriority('--ds-accent'), 'important')
})
test('observes root attributes and disconnects without observing portal', () => {
  let callback, target, config, disconnected = false
  class Observer {
    constructor(cb) { callback = cb }
    observe(t, c) { target = t; config = c }
    disconnect() { disconnected = true }
  }
  const source = element(), portal = element()
  const binding = bindPortalTheme(source, portal, { ...options, Observer })
  assert.equal(target, source)
  assert.deepEqual(config.attributeFilter, ['data-skin', 'data-theme', 'style', 'class'])
  source.setAttribute('data-theme', 'dark'); callback()
  assert.equal(portal.getAttribute('data-theme'), 'dark')
  binding.dispose(); callback()
  assert.equal(disconnected, true)
  assert.equal(portal.getAttribute('data-theme'), null)
})
test('rejects invalid or nested source/portal pairs', () => {
  const source = element(), portal = element()
  assert.throws(() => bindPortalTheme(source, source, options), TypeError)
  assert.throws(() => bindPortalTheme(null, portal, options), TypeError)
  source.contains = () => true
  assert.throws(() => bindPortalTheme(source, portal, options), TypeError)
})
test('stylesheet declares all public tokens and explicit scope boundary', async () => {
  const css = await readFile(new URL('../styles/themes.css', import.meta.url), 'utf8')
  for (const token of themeTokens) assert.ok(css.includes(`${token}:`), token)
  assert.ok(css.includes('@scope ([data-theme-root]) to ([data-theme-root])'))
  assert.ok(css.includes('[data-skin="ember"][data-theme="dark"]'))
  assert.doesNotMatch(css, /@import|url\(/)
})
test('fixture IDs and references are consistent, with two detached dialogs', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(ids.length, new Set(ids).size)
  for (const match of html.matchAll(/\b(?:aria-controls|aria-labelledby|data-portal)="([^"]+)"/g)) {
    assert.ok(ids.includes(match[1]), match[1])
  }
  assert.equal((html.match(/<dialog /g) ?? []).length, 2)
  assert.equal((html.match(/data-demo-root /g) ?? []).length, 2)
  assert.ok(html.indexOf('</main>') < html.indexOf('<dialog '))
})
