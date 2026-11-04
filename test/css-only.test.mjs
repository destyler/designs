import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { transform } from 'lightningcss'
import postcss from 'postcss'
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const css = await read('packages/css-only/styles.css')

test('distribution is stylesheet only, without runtime, build or peer dependencies', async () => {
  const pkg = JSON.parse(await read('packages/css-only/package.json'))
  assert.deepEqual(pkg.exports, { './styles.css': './styles.css' })
  assert.deepEqual(pkg.sideEffects, ['*.css'])
  for (const key of ['dependencies', 'peerDependencies', 'scripts']) assert.equal(pkg[key], undefined)
  assert.ok(pkg.files.every(file => !/\.(js|ts|tsx|vue|svelte)$/.test(file)))
})

test('CSS parses and only uses low-specificity native anatomy selectors plus optional theme scope', () => {
  transform({ filename: 'styles.css', code: Buffer.from(css), errorRecovery: false })
  const ast = postcss.parse(css)
  for (const node of ast.nodes) if (node.type !== 'comment') assert.equal(node.name, 'layer')
  ast.walkRules(rule => {
    if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return
    assert.ok(rule.selector.startsWith(':where('), rule.selector)
    assert.doesNotMatch(rule.selector, /\):[a-z]/, 'State selectors must also stay inside :where')
    if (!rule.selector.includes('[data-scope=')) {
      assert.ok(rule.selector.includes('[data-theme='), rule.selector)
      rule.walkDecls(decl => assert.ok(decl.prop.startsWith('--dy-'), 'Theme must not reset global elements'))
    }
    assert.ok(!/\.\w|#[\w-]|data-case|data-fixture|data-portal/.test(rule.selector), rule.selector)
  })
  assert.doesNotMatch(css, /!important|@import|url\(/)
  assert.match(css, /\[data-scope="dialog"\]\[hidden\]\) \{ display: none;/)
  assert.match(css, /\[dir="rtl"\].*translate: calc\(-100% \+ 2px\)/)
  assert.match(css, /prefers-reduced-motion/)
})

test('all four consumers use native primitives with no styling maps, classes, runtime or required style plugin', async () => {
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const ext = ['vue', 'svelte'].includes(framework) ? framework : 'tsx'
    const fixture = await read(`examples/css-only/${framework}/Example.${ext}`)
    assert.match(fixture, new RegExp(`@destyler-ui/${framework}`))
    assert.doesNotMatch(fixture, /\bclass(?:Name)?\s*=|:class=|\bstyle\s*=|designs-|vanilla-extract|tailwind|unocss/)
    const main = await read(`examples/css-only/${framework}/main.${['react', 'solid'].includes(framework) ? 'tsx' : 'ts'}`)
    assert.match(main, /import '\.\/styles'/)
    const styleEntry = await read(`examples/css-only/${framework}/styles.ts`)
    assert.equal(styleEntry.trim(), "import '@destyler/designs-css-only-poc/styles.css'")
    const config = await read(`examples/css-only/${framework}/vite.config.ts`)
    assert.doesNotMatch(config, /import.+(?:vanilla-extract|tailwind|unocss)/)
  }
})

test('derived colors resolve at the primitive, not on an ancestor theme', () => {
  assert.match(css, /background: color-mix\(in oklab, var\(--dy-input\) var\(--dy-track-opacity\), transparent\)/)
  assert.match(css, /light-dark\(var\(--dy-background\), var\(--dy-primary-foreground\)\)/)
  assert.doesNotMatch(css, /--dy-switch-thumb-on: var\(/)
})

test('documentation canvas does not reset primitives or change the root rem size', async () => {
  const canvas = postcss.parse(await read('examples/css-only/shared/showcase.css'))
  canvas.walkRules(rule => {
    assert.doesNotMatch(rule.selector, /\*|data-scope|data-part/)
    if (rule.selector.includes('html')) rule.walkDecls(decl => assert.notEqual(decl.prop, 'font-size', 'Keep rem-based primitive sizes independent of canvas text size'))
  })
})
