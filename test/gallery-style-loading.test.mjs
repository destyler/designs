import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')

test('all four framework entrypoints await family-specific CSS instead of eagerly loading Basic', async () => {
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const extension = ['react', 'solid'].includes(framework) ? 'tsx' : 'ts'
    const source = await read(`examples/all-components/${framework}/main.${extension}`)
    assert.match(source, /loadFamilyStyles\(family\)\.then\(\(\) =>/)
    assert.doesNotMatch(source, /import ['"]\.\.\/shared\/theme\.css/)
  }
  const loader = await read('examples/all-components/shared/load-family-styles.ts')
  assert.match(loader, /family === 'switch' \|\| family === 'dialog'/)
  assert.match(loader, /import\('\.\/css-only-gallery\.css'\)/)
  assert.match(loader, /: import\('\.\/theme\.css'\)/)
})

test('CSS-only code tabs export the actual package and composition stylesheet', async () => {
  const exporter = await read('scripts/export-all-component-sources.mjs')
  assert.match(exporter, /'packages\/css-only\/styles\.css'/)
  assert.match(exporter, /css-only-gallery\.json/)
  const host = await read('examples/all-components/gallery.ts')
  assert.match(host, /family === 'switch' \|\| family === 'dialog'/)
  assert.match(host, /css-only-gallery\.json/)
  assert.match(host, /file\.repositoryPath \?\?/)
})
