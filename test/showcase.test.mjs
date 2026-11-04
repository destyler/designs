import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const main = await read('examples/showcase/main.tsx')
const source = await read('examples/showcase/source.tsx')

test('root showcases only real four-framework Switch/Dialog while preserving earlier applications', async () => {
  assert.match(await read('index.html'), /\/examples\/showcase\/main\.tsx/)
  assert.match(await read('examples/shadcn/index.html'), /main\.tsx/)
  assert.match(main, /two-component prototype, not a complete component collection/)
  assert.match(main, /href="\/examples\/shadcn\/"/)
  assert.match(main, /href="\/vanilla-extract\/react\/"/)
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const extension = framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'tsx'
    const adapter = await read(`examples/vanilla-extract/${framework}/Showcase.${extension}`)
    assert.ok(adapter.includes(`@destyler-ui/${framework}`), `${framework}: published primitive import`)
    assert.match(adapter, /@destyler\/designs-vanilla-extract-poc/)
    assert.match(adapter, /Switch\.Root/)
    assert.match(adapter, /Dialog\.Root/)
    assert.ok(source.includes(`../vanilla-extract/${framework}/Showcase.${extension}?raw`), `${framework}: live source import`)
    await access(new URL(`../examples/vanilla-extract/${framework}/vite.config.ts`, import.meta.url))
  }
})

test('reference is separate from framework and right-side view switching', () => {
  assert.match(main, /<ReferenceDemo dark=\{modes\.reference\} example=\{example\}/)
  assert.match(main, /<FrameworkPreview key=\{framework\} framework=\{framework\}/)
  assert.match(main, /id="preview-panel"[^>]+hidden=\{showCode\}/)
  assert.match(main, /id="code-panel"[^>]+hidden=\{!showCode\}/)
  assert.match(main, /aria-label="Destyler view"/)
  assert.doesNotMatch(main, /<ReferenceDemo[^>]*framework/)
})

test('code uses exact package CSS and style definitions rather than the host page stylesheet', () => {
  assert.match(source, /packages\/vanilla-extract\/dist\/styles\.css\?raw/)
  assert.match(source, /packages\/vanilla-extract\/src\/styles\.css\.ts\?raw/)
  assert.match(source, /navigator\.clipboard\.writeText\(selected\.code\)/)
  assert.doesNotMatch(source, /document\.querySelectorAll|fetch\(/)
})

test('frame messages validate both source window and origin in each direction', async () => {
  assert.match(main, /event\.origin !== location\.origin/)
  assert.match(main, /event\.source !== frame\.current\?\.contentWindow/)
  const shared = await read('examples/vanilla-extract/shared/showcase.ts')
  assert.match(shared, /event\.origin !== location\.origin/)
  assert.match(shared, /event\.source !== parent/)
  assert.match(shared, /\['switch', 'dialog'\]\.includes\(value\.component\)/)
  assert.match(shared, /\['light', 'dark'\]\.includes\(value\.theme\)/)
  assert.doesNotMatch(main + shared, /postMessage\([^\n]+['"]\*['"]/)
})


test('IDE file tabs identify actual files, support keyboard navigation and separate generated output', () => {
  assert.match(source, /role="tablist" aria-label="Source files"/)
  assert.match(source, /aria-selected=\{file === id\}/)
  assert.match(source, /tabIndex=\{file === id \? 0 : -1\}/)
  assert.match(source, /ArrowLeft.*ArrowRight.*Home.*End/)
  assert.match(source, /className="source-file-path"/)
  assert.match(source, /className="source-line-numbers" aria-hidden="true"/)
  assert.match(source, /selected.generated \? <button onClick=\{download\}/)
  assert.doesNotMatch(source, /<select/)
  assert.doesNotMatch(main, /showCode && <SourceInspector/)
})
