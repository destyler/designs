import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
const root = new URL('../packages/vanilla-extract/', import.meta.url)
let built = true
try { await access(new URL('dist/index.js', root)) } catch { built = false }

test('style package has no consumer dependencies and retains CSS side effects', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
  assert.equal(pkg.private, true, 'PoC must not publish accidentally')
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0)
  assert.equal(Object.keys(pkg.peerDependencies || {}).length, 0)
  assert.deepEqual(pkg.sideEffects, ['**/*.css'])
  assert.equal(pkg.exports['./styles.css'], './dist/styles.css')
})

test('built class and token contracts import without a DOM or authoring runtime', { skip: !built && 'Run build:vanilla-extract first' }, async () => {
  const js = await readFile(new URL('dist/index.js', root), 'utf8')
  assert.doesNotMatch(js, /vanilla-extract|document\.|window\.|createTheme\(|style\(/)
  const { classes, themes, vars } = await import(new URL('dist/index.js', root))
  assert.deepEqual(Object.keys(classes).sort(), ['switchRoot', 'switchControl', 'switchThumb', 'switchLabel', 'button', 'dialogBackdrop', 'dialogPositioner', 'dialogContent', 'dialogHeader', 'dialogTitle', 'dialogDescription', 'dialogFooter', 'dialogClose'].sort())
  for (const value of Object.values(classes)) assert.equal(typeof value, 'string')
  assert.ok(themes.light && themes.dark)
  for (const value of Object.values(vars)) assert.match(value, /^var\(--dy-/)
  const css = await readFile(new URL('dist/styles.css', root), 'utf8')
  assert.match(css, /@layer destyler/)
  assert.match(css, /data-state/)
  assert.match(css, /prefers-reduced-motion/)
  assert.match(css, /data-disabled/)
  for (const value of Object.values(classes)) assert.ok(css.includes(`.${value}`), `Missing selector for ${value}`)
})
