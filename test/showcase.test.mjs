import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const main = await read('examples/showcase/main.tsx')
const source = await read('examples/showcase/source.tsx')

test('root showcases only real four-framework Switch/Dialog while preserving earlier applications', async () => {
  assert.match(await read('src/pages/index.astro'), /<Comparison client:load/)
  assert.match(await read('examples/shadcn/index.html'), /main\.tsx/)
  assert.match(main, /two-component prototype, not a complete component collection/)
  assert.match(main, /href=\{`\/vanilla-extract\/\$\{framework\}\//)
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const extension = framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'tsx'
    const adapter = await read(`examples/vanilla-extract/${framework}/Showcase.${extension}`)
    assert.match(adapter, /@destyler\/designs-vanilla-extract-poc/)
    for (const component of ['Switch', 'Dialog']) {
      const componentSource = await read(`examples/vanilla-extract/${framework}/${component}Example.${extension}`)
      assert.ok(componentSource.includes(`@destyler-ui/${framework}`), `${framework}: published primitive import`)
      assert.ok(componentSource.includes(`<${component}.Root`))
      assert.ok(adapter.includes(`<${component}Example`), `${framework}: renders the displayed file`)
      assert.ok(source.includes(`../vanilla-extract/${framework}/${component}Example.${extension}?raw`))
      assert.doesNotMatch(componentSource, component === 'Switch' ? /Dialog/ : /Switch/)
      assert.doesNotMatch(componentSource, /connectShowcase|initialShowcaseState|postMessage|showcase-stage/)
    }
    await access(new URL(`../examples/vanilla-extract/${framework}/vite.config.ts`, import.meta.url))
  }
})

test('reference is above four independently stateful framework cards', () => {
  assert.match(main, /<FrameworkPreview reference framework="react" example=\{example\} dark=\{modes\.reference\}/)
  assert.match(main, /function ImplementationPanel/)
  assert.match(main, /<ImplementationPanel key=\{framework\} framework=\{framework\}/)
  assert.match(main, /className="implementations-grid"/)
  assert.ok(main.indexOf('data-demo="reference"') < main.indexOf('className="implementations-grid"'))
  assert.match(main, /id=\{`\$\{framework\}-preview-panel`\}[^>]+hidden=\{showCode\}/)
  assert.match(main, /id=\{`\$\{framework\}-code-panel`\}[^>]+hidden=\{!showCode\}/)
  assert.match(main, /aria-label=\{`\$\{label\} view`\}/)
  assert.doesNotMatch(main, /<FrameworkPreview reference[^>]*key=/)
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
  assert.match(shared, /event\.origin !== window\.location\.origin/)
  assert.match(shared, /event\.source !== window\.parent/)
  assert.match(shared, /\['switch', 'dialog'\]\.includes\(value\.component\)/)
  assert.match(shared, /\['light', 'dark'\]\.includes\(value\.theme\)/)
  assert.doesNotMatch(main + shared, /postMessage\([^\n]+['"]\*['"]/)
})


test('IDE file tabs identify actual files, support keyboard navigation and separate generated output', () => {
  assert.match(source, /role="tablist" aria-label=\{`\$\{frameworks\[framework\]\} source files`\}/)
  assert.match(source, /aria-selected=\{file === id\}/)
  assert.match(source, /tabIndex=\{file === id \? 0 : -1\}/)
  assert.match(source, /ArrowLeft.*ArrowRight.*Home.*End/)
  assert.match(source, /className="source-file-path"/)
  assert.match(source, /className="source-line-numbers" aria-hidden="true"/)
  assert.match(source, /selected.generated \? <button onClick=\{download\}/)
  assert.doesNotMatch(source, /<select/)
  assert.doesNotMatch(main, /showCode && <SourceInspector/)
})


test('Astro owns the document and shell; the comparison is server-rendered before hydration', async () => {
  assert.match(await read('astro.config.mjs'), /output: 'static'/)
  assert.match(await read('src/layouts/SiteLayout.astro'), /Astro.generator/)
  assert.match(await read('src/pages/index.astro'), /<header class="site-header"/)
  assert.match(await read('src/pages/index.astro'), /<aside class="sidebar"/)
  assert.doesNotMatch(main, /createRoot|document.getElementById\('app'\)/)
  assert.doesNotMatch(await read('src/pages/index.astro'), /client:only/)
})

test('component-only compositions retain real primitives without application fixtures', async () => {
  const reference = await read('examples/showcase/ReferencePreview.tsx')
  assert.match(reference, /vendor\/shadcn\/new-york-v4\/ui\/switch/)
  assert.match(reference, /vendor\/shadcn\/new-york-v4\/ui\/dialog/)
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const extension = framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'tsx'
    const adapter = await read(`examples/vanilla-extract/${framework}/Showcase.${extension}`)
    assert.equal((adapter.match(/<SwitchExample/g) || []).length, 1)
    assert.equal((adapter.match(/<DialogExample/g) || []).length, 1)
    assert.doesNotMatch(adapter, /Notifications|Marketing|Settings|showcase-card|showcase-row/)
    assert.match(await read(`examples/vanilla-extract/${framework}/DialogExample.${extension}`), /Open dialog/)
  }
  assert.doesNotMatch(reference, /Notifications|Marketing|Settings|<Card/)
})


test('source follows the selected component and hides preview plumbing', () => {
  assert.match(source, /sources\[framework\]\[example\]/)
  assert.match(source, /const fileIds = \['component', 'styles', 'css'\]/)
  assert.doesNotMatch(source, /shared\/showcase|Showcase\.(tsx|vue|svelte)\?raw|dist\/index\.js\?raw/)
  assert.match(source, /setFile\('component'\).*\[example\]/)
  assert.match(source, /\[file, framework, example\]/)
})

test('all frameworks remain visible without framework selection or persistence', () => {
  assert.doesNotMatch(main, /localStorage|selectFramework|<select|Destyler framework/)
  assert.match(main, /Object.keys\(frameworks\)/)
  assert.match(main, /reference: false, react: false, vue: false, solid: false, svelte: false/)
  assert.match(source, /data-source-framework=\{framework\}/)
  for (const suffix of ['source-tab-', 'source-file-panel', 'source-file-note']) {
    assert.ok(source.includes('${framework}-' + suffix), `${suffix}: framework-qualified ID`)
  }
})
