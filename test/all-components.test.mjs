import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const catalog = JSON.parse(await readFile(join(root, 'examples/all-components/shared/catalog.json'), 'utf8'))

test('reconstruction explicitly identifies its source and includes 46 unique families', () => {
  assert.equal(catalog.reconstruction, true)
  assert.equal(catalog.sourceCommit, '77c065367954fe170ee71f6a6782929fd6ecd6f2')
  assert.equal(catalog.baselineCommit, '2de461c810960079489647a560b516059f138bfd')
  assert.equal(catalog.families.length, 46)
  assert.equal(new Set(catalog.families).size, 46)
  assert.deepEqual(catalog.frameworks, ['react', 'vue', 'solid', 'svelte'])
})
for (const framework of catalog.frameworks) test(`${framework} registry has every real family exactly once`, async () => {
  const registry = await readFile(join(root, `examples/all-components/${framework}/registry.ts`), 'utf8')
  for (const family of catalog.families) assert.match(registry, new RegExp(`['"]${family}['"]\\s*:`), `${family} is registered`)
  assert.doesNotMatch(registry, /placeholder|TODO|not implemented/i)
})
test('new gallery keeps original page intact and discloses reconstruction limits', async () => {
  const page = await readFile(join(root, 'src/pages/components.astro'), 'utf8')
  assert.match(page, /not the missing v7 candidate/)
  assert.match(page, /assistive-technology acceptance are still pending/)
  assert.match(page, /Open the original Switch \/ Dialog comparison/)
  const original = await readFile(join(root, 'src/pages/index.astro'), 'utf8')
  assert.match(original, /Explore components<\/span><span>02/)
})
test('gallery readiness uses verified iframe source, origin and exact selected state', async () => {
  const script = await readFile(join(root, 'examples/all-components/gallery.ts'), 'utf8')
  assert.match(script, /message\.origin !== win\.location\.origin/)
  assert.match(script, /message\.source !== card\.querySelector\('iframe'\)!\.contentWindow/)
  assert.match(script, /message\.data\.family !== selected/)
  assert.match(script, /message\.data\.theme !== card\.dataset\.theme/)
})
test('framework mounts share the same CSS container contract', async () => {
  const css = await readFile(join(root, 'examples/all-components/shared/theme.css'), 'utf8')
  assert.match(css, /:is\(#app, #root\)/)
  for (const framework of ['react', 'solid']) {
    const html = await readFile(join(root, `examples/all-components/${framework}/index.html`), 'utf8')
    assert.match(html, /id="root" class="ds-example-content"/)
  }
})
test('development workflow builds and serves the complete gallery without stale sources', async () => {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  assert.match(pkg.scripts.dev, /build:all-components:sources/)
  assert.match(pkg.scripts.dev, /build:all-components:frames/)
  const middleware = await readFile(join(root, 'scripts/astro-consumer-previews.mjs'), 'utf8')
  assert.match(middleware, /'all-components'/)
  assert.match(middleware, /pathname\.startsWith\('\/source\/'\)\) return next\(\)/)
})
