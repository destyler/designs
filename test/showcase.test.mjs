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
  assert.match(main, /href=\{`\/css-only\/\$\{framework\}\//)
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const extension = framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'tsx'
    const adapter = await read(`examples/css-only/${framework}/Showcase.${extension}`)
    assert.doesNotMatch(adapter, /designs-vanilla-extract|\b(?:className|class)\s*=/)
    assert.match(adapter, /data-showcase/)
    for (const component of ['Switch', 'Dialog']) {
      const componentSource = await read(`examples/css-only/${framework}/${component}Example.${extension}`)
      assert.ok(componentSource.includes(`@destyler-ui/${framework}`), `${framework}: published primitive import`)
      assert.ok(componentSource.includes(`<${component}.Root`))
      assert.ok(adapter.includes(`<${component}Example`), `${framework}: renders the displayed file`)
      assert.ok(source.includes(`../css-only/${framework}/${component}Example.${extension}?raw`))
      assert.doesNotMatch(componentSource, component === 'Switch' ? /Dialog/ : /Switch/)
      assert.doesNotMatch(componentSource, /connectShowcase|initialShowcaseState|postMessage|showcase-stage|colorMode|\b(?:className|class|style)\s*=|designs-vanilla-extract/)
      assert.doesNotMatch(componentSource, /import\s*\{[^}]*\b(?:classes|themes)\b/)
    }
    await access(new URL(`../examples/css-only/${framework}/vite.config.ts`, import.meta.url))
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

test('code uses exact CSS package and framework CSS imports rather than host page styles', async () => {
  assert.match(source, /packages\/css-only\/styles\.css\?raw/)
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const extension = framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'tsx'
    for (const component of ['Switch', 'Dialog']) {
      assert.match(await read(`examples/css-only/${framework}/${component}Example.${extension}`), /import ['"]@destyler\/designs-css-only-poc\/styles\.css['"]/)
    }
  }
  assert.doesNotMatch(source, /styles\.ts|reactStyles|vueStyles|solidStyles|svelteStyles/)
  assert.match(source, /navigator\.clipboard\.writeText\(selected\.code\)/)
  assert.doesNotMatch(source, /document\.querySelectorAll|fetch\(/)
})

test('frame messages validate both source window and origin in each direction', async () => {
  assert.match(main, /event\.origin !== location\.origin/)
  assert.match(main, /event\.source !== frame\.current\?\.contentWindow/)
  const shared = await read('examples/css-only/shared/showcase.ts')
  assert.match(shared, /event\.origin !== window\.location\.origin/)
  assert.match(shared, /event\.source !== window\.parent/)
  assert.match(shared, /\['switch', 'dialog'\]\.includes\(value\.component\)/)
  assert.match(shared, /\['light', 'dark'\]\.includes\(value\.theme\)/)
  assert.doesNotMatch(main + shared, /postMessage\([^\n]+['"]\*['"]/)
})


test('IDE file tabs identify actual files and support keyboard navigation', () => {
  assert.match(source, /role="tablist" aria-label=\{`\$\{frameworks\[framework\]\} source files`\}/)
  assert.match(source, /aria-selected=\{file === id\}/)
  assert.match(source, /tabIndex=\{file === id \? 0 : -1\}/)
  assert.match(source, /ArrowLeft.*ArrowRight.*Home.*End/)
  assert.match(source, /className="source-file-path"/)
  assert.match(source, /className="source-line-numbers" aria-hidden="true"/)
  assert.doesNotMatch(source, /generated: true|Generated component stylesheet|Compiled by vanilla-extract/)
  assert.match(source, /selected.downloadable \? <button onClick=\{download\}/)
  assert.match(source, /Distributed CSS/)
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
    const adapter = await read(`examples/css-only/${framework}/Showcase.${extension}`)
    assert.equal((adapter.match(/<SwitchExample/g) || []).length, 1)
    assert.equal((adapter.match(/<DialogExample/g) || []).length, 1)
    assert.doesNotMatch(adapter, /Notifications|Marketing|Settings|showcase-card|showcase-row/)
    assert.match(await read(`examples/css-only/${framework}/DialogExample.${extension}`), /Open dialog/)
  }
  assert.doesNotMatch(reference, /Notifications|Marketing|Settings|<Card/)
})


test('source follows the selected component and hides preview plumbing', () => {
  assert.match(source, /sources\[framework\]\[example\]/)
  assert.match(source, /const fileIds = \['component', 'css'\]/)
  assert.doesNotMatch(source, /shared\/showcase|Showcase\.(tsx|vue|svelte)\?raw|dist\/index\.js\?raw/)
  assert.match(source, /setFile\('component'\).*\[example\]/)
  assert.match(source, /\[file, framework, example\]/)
})

test('all frameworks remain visible without framework selection or persistence', () => {
  assert.doesNotMatch(main, /localStorage|selectFramework|<select|Destyler framework/)
  assert.match(main, /Object.keys\(frameworks\)/)
  assert.match(main, /reference: true, react: true, vue: true, solid: true, svelte: true/)
  assert.match(source, /data-source-framework=\{framework\}/)
  for (const suffix of ['source-tab-', 'source-file-panel', 'source-file-note']) {
    assert.ok(source.includes('${framework}-' + suffix), `${suffix}: framework-qualified ID`)
  }
})


test('original reference owns an isolated document and keeps upstream close control', async () => {
  const page = await read('src/pages/reference.astro')
  const reference = await read('examples/showcase/ReferencePreview.tsx')
  const css = await read('examples/showcase/reference.css')
  assert.doesNotMatch(page, /SiteLayout|showcase\.css|app\.css/)
  assert.match(page, /reference\.css/)
  assert.match(css, /vendor\/shadcn\/zinc\.css/)
  assert.match(css, /\*\s*\{\s*@apply border-border outline-ring\/50;/)
  assert.doesNotMatch(css, /@import[^;]*(?:designs-css-only|showcase|app\.css|tokens\.css)/)
  assert.doesNotMatch(reference, /showCloseButton=\{false\}|<DialogContent[^>]*className=/)
  assert.match(reference, /root\.classList\.toggle\('dark', state\.theme === 'dark'\)/)
  assert.match(reference, /root\.dataset\.theme = state\.theme/)
})


test('comparison workspace is full-bleed with joined framework panels', async () => {
  const css = await read('examples/showcase/showcase.css')
  assert.match(css, /\.unified-showcase \.site-layout \{ max-width: none;/)
  assert.match(css, /\.unified-showcase \.main-content \{ max-width: none; padding: 38px 0 0;/)
  assert.match(css, /padding-inline: var\(--shell-inset\)/, 'Text keeps its reading inset')
  assert.match(css, /\.implementations-grid \{[^}]*align-items: stretch; gap: 0;/)
  assert.match(css, /\.destyler-panel:nth-child\(odd\) \{ border-right: 1px solid var\(--shell-line\);/)
  assert.match(css, /@media \(max-width: 860px\) \{\s*\.implementations-grid \{ grid-template-columns: minmax\(0,1fr\);/)
  assert.match(css, /\.destyler-panel:nth-child\(odd\) \{ border-right: 0;/)
  assert.match(css, /\.destyler-panel > \[role=tabpanel\] \{ grid-row: 3;/)
  assert.match(css, /\.destyler-toolbar button,[^}]*outline-offset: -3px !important;/)
})
