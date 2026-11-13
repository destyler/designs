import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFile(join(root, path), 'utf8')
const manifest = JSON.parse(await read('docs/shadcn-gallery-sources.json'))
const catalog = JSON.parse(await read('examples/all-components/shared/catalog.json'))
const coverage = JSON.parse(await read('examples/all-components/shared/shadcn-coverage.json'))

test('new original shadcn sources extend the existing immutable upstream snapshot', async () => {
  const existing = JSON.parse(await read('docs/shadcn-sources.json'))
  assert.equal(manifest.commit, existing.commit)
  assert.equal(manifest.extends, 'docs/shadcn-sources.json')
  assert.equal(manifest.files.length, 29)
  for (const file of manifest.files) {
    const bytes = Buffer.from(await read(file.path))
    assert.equal(bytes.length, file.bytes, file.path)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path)
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), file.gitBlobSha, file.path)
    assert.match(file.url, new RegExp(manifest.commit))
  }
})
test('reference dependencies use exact versions from the same pinned upstream lock', async () => {
  const pkg = JSON.parse(await read('package.json'))
  const lock = JSON.parse(await read('package-lock.json'))
  for (const [name, value] of Object.entries(manifest.additionalDependencies)) {
    assert.equal(pkg.dependencies[name], value.resolvedVersion, name)
    assert.equal(lock.packages[`node_modules/${name}`].version, value.resolvedVersion, name)
  }
  for (const name of catalog.frameworks) assert.equal(pkg.dependencies[`@destyler-ui/${name}`], '0.0.5')
})
test('all 46 families have honest reference coverage rather than fabricated counterparts', async () => {
  assert.deepEqual(Object.keys(coverage).sort(), [...catalog.families].sort())
  const totals = { direct: 0, composed: 0, none: 0 }
  for (const family of catalog.families) {
    const item = coverage[family]
    assert.ok(Object.hasOwn(totals, item.status)); totals[item.status]++
    assert.ok(item.explanation.length > 20, family)
    const demo = await read(`examples/all-components/shadcn/demos/${family}.tsx`)
    if (item.status === 'none') {
      assert.equal(item.components.length, 0, family)
      assert.match(demo, /ReferenceState/, family)
    } else {
      assert.ok(item.components.length > 0, family)
      for (const component of item.components) {
        assert.ok(manifest.upstreamDirectory.files.some(file => file.name === component + '.tsx'))
        assert.ok(item.sourceUrls.some(url => url.endsWith(`/${component}.tsx`) && url.includes(manifest.commit)))
      }
    }
  }
  assert.deepEqual(totals, { direct: 32, composed: 1, none: 13 })
})
test('reference build uses original isolated Tailwind/Zinc styling and its own entry', async () => {
  const css = await read('examples/all-components/shadcn/reference.css')
  assert.match(css, /tailwindcss/)
  assert.match(css, /vendor\/shadcn\/zinc\.css/)
  assert.doesNotMatch(css, /shared\/theme\.css/)
  const build = await read('scripts/build-all-components.mjs')
  assert.match(build, /'shadcn'/)
  const exportScript = await read('scripts/export-all-component-sources.mjs')
  assert.match(exportScript, /export-shadcn-reference-sources/)
})
