import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, mkdtemp, mkdir, cp, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = p => readFile(resolve(root, p), 'utf8')
const manifest = JSON.parse(await read('docs/shadcn-sources.json'))
const generated = await read('examples/shadcn/styles/recipes.ts')
const sourceRecipes = JSON.parse(generated.match(/export const sourceRecipes = ([\s\S]*?) as const/)[1])
const recipes = JSON.parse(generated.match(/export const recipes = ([\s\S]*?) as const/)[1])
const components = ['tabs', 'switch', 'checkbox', 'label', 'card', 'button', 'dialog']

test('vendored files preserve pinned source bytes, URLs and MIT notice', async () => {
  assert.equal(manifest.commit, '4aaea19d9cff3e0908e12a8c1d504b8c5ec34610')
  assert.equal(manifest.files.length, 10)
  for (const f of manifest.files) {
    const bytes = await readFile(resolve(root, f.path))
    assert.equal(bytes.length, f.bytes, f.path)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), f.sha256, f.path)
    assert.equal(f.url, `${manifest.repository}/blob/${manifest.commit}/${f.source}`)
  }
  assert.match(await read('vendor/shadcn/LICENSE'), /Copyright \(c\) 2023 shadcn/)
  assert.match(generated, /MIT; see vendor\/shadcn\/LICENSE/)
})

test('extractor is deterministic and checked-in outputs are current, without changing app files', async () => {
  const temp = await mkdtemp(resolve(tmpdir(), 'shadcn-provenance-'))
  try {
    await mkdir(resolve(temp, 'scripts'), { recursive: true })
    await mkdir(resolve(temp, 'examples/shadcn/styles'), { recursive: true })
    await cp(resolve(root, 'vendor'), resolve(temp, 'vendor'), { recursive: true })
    await cp(resolve(root, 'scripts/extract-shadcn-recipes.mjs'), resolve(temp, 'scripts/extract-shadcn-recipes.mjs'))
    await symlink(resolve(root, 'node_modules'), resolve(temp, 'node_modules'), 'dir')
    for (let run = 0; run < 2; run++) {
      execFileSync(process.execPath, ['scripts/extract-shadcn-recipes.mjs'], { cwd: temp })
      for (const file of ['recipes.ts', 'tokens.css']) {
        assert.equal(await readFile(resolve(temp, 'examples/shadcn/styles', file), 'utf8'), await read(`examples/shadcn/styles/${file}`), file)
      }
    }
  } finally { await rm(temp, { recursive: true, force: true }) }
})

test('every source recipe token is an exact upstream class token, including CVA defaults', async () => {
  // Independent whitelist from all upstream string literals, not the extractor output.
  const tokens = new Set()
  for (const component of components) {
    const source = ts.createSourceFile(component + '.tsx', await read(`vendor/shadcn/new-york-v4/ui/${component}.tsx`), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    function visit(node) {
      if (ts.isStringLiteral(node)) for (const token of node.text.split(/\s+/)) tokens.add(token)
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  for (const [slot, classes] of Object.entries(sourceRecipes)) {
    assert.ok(classes, slot)
    for (const token of classes.split(/\s+/)) assert.ok(tokens.has(token), `${slot}: invented token ${token}`)
  }
  assert.equal(sourceRecipes.card, 'flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm')
  assert.match(sourceRecipes['tabs-list'], / bg-muted$/)
  assert.match(sourceRecipes.button, /h-9/)
})

test('adapter recipes differ only by documented behavior selectors', () => {
  assert.deepEqual(Object.keys(recipes), Object.keys(sourceRecipes))
  for (const [slot, value] of Object.entries(sourceRecipes)) {
    let expected = value
    if (slot === 'label') expected = expected.replaceAll('peer-disabled:', 'peer-data-[disabled]:')
    if (slot === 'tabs-trigger') expected = expected.replaceAll('data-[state=active]', 'data-[selected]')
    if (slot === 'switch' || slot === 'checkbox') expected = expected.replaceAll('focus-visible:', 'data-[focus-visible]:').replaceAll('disabled:', 'data-[disabled]:').replaceAll('aria-invalid:', 'data-[invalid]:')
    assert.equal(recipes[slot], expected, slot)
  }
  assert.match(sourceRecipes.label, /peer-disabled:opacity-50/)
  assert.match(recipes.label, /peer-data-\[disabled\]:opacity-50/)
  assert.doesNotMatch(recipes.label, /(?<!peer-)data-\[disabled\]:opacity-50/)
})

test('Zinc values match canonical source and CSS is scoped without changing values', async () => {
  const theme = await read('vendor/shadcn/themes.ts')
  const zinc = theme.slice(theme.indexOf('    name: "zinc"'), theme.indexOf('    name: "mauve"'))
  const css = await read('vendor/shadcn/zinc.css')
  for (const [mode, selector] of [['light', ':root'], ['dark', '.dark']]) {
    const block = zinc.match(new RegExp(mode + ': \\{([\\s\\S]*?)\\n      \\}'))[1]
    const expected = Object.fromEntries([...block.matchAll(/^\s*(?:"([^"]+)"|([\w-]+)): "([^"]+)",/gm)].map(m => [m[1] || m[2], m[3]]))
    const start = css.indexOf(selector + ' {')
    const actual = Object.fromEntries([...css.slice(start, css.indexOf('}', start)).matchAll(/--([\w-]+): ([^;]+);/g)].map(m => [m[1], m[2]]))
    assert.deepEqual(actual, expected, mode)
  }
  assert.equal(await read('examples/shadcn/styles/tokens.css'), css.replace(':root {', '[data-design="shadcn"] {').replace('.dark {', '[data-design="shadcn"].dark {').replace('see ./LICENSE', 'see vendor/shadcn/LICENSE'))
})

test('reference imports real vendored source; adapters import pinned published Destyler packages', async () => {
  const pkg = JSON.parse(await read('package.json'))
  const reference = await read('examples/shadcn/components/ReferenceDemo.tsx')
  for (const component of components) assert.ok(reference.includes(`../../../vendor/shadcn/new-york-v4/ui/${component}'`), component)
  for (const [framework, file] of [['react', 'ReactDemo.tsx'], ['vue', 'VueDemo.vue']]) {
    const name = `@destyler-ui/${framework}`
    assert.match(pkg.dependencies[name], /^\d+\.\d+\.\d+(?:-[\w.]+)?$/)
    const adapter = await read(`examples/shadcn/adapters/${file}`)
    assert.ok(adapter.includes(`from '${name}'`))
    for (const part of ['Tabs.Root', 'Tabs.Trigger', 'Switch.Control', 'Switch.Thumb', 'Switch.HiddenInput', 'Checkbox.Control', 'Checkbox.HiddenInput', 'Dialog.Content']) assert.ok(adapter.includes('<' + part), `${framework}: ${part}`)
    assert.doesNotMatch(adapter, /from ['"](?:radix-ui|.*vendor\/shadcn)/)
    assert.doesNotMatch(adapter, /<input\b[^>]*type=['"](?:checkbox|radio)['"]/)
  }
  const config = await read('vite.config.ts')
  assert.ok(config.includes("'@/registry/new-york-v4/ui'"))
  assert.ok(config.includes("'./vendor/shadcn/new-york-v4/ui'"))
  assert.ok(config.includes("'cn':"))
})
