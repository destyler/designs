import { compile } from '@tailwindcss/node'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { transformWithEsbuild } from 'vite'
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(repo, 'examples/vanilla-extract/shared/baseline.source.css')
const compiler = await compile(await readFile(source, 'utf8'), { base: dirname(source), onDependency() {} })
const recipeSource = await readFile(resolve(repo, 'examples/shadcn/styles/recipes.ts'), 'utf8')
const recipes = JSON.parse(recipeSource.split('export const recipes = ')[1].split(' as const')[0])
const keys = ['switch', 'switch-thumb', 'label', 'button', 'dialog-overlay', 'dialog-content', 'dialog-close', 'dialog-header', 'dialog-footer', 'dialog-title', 'dialog-description']
await writeFile(resolve(dirname(source), 'baseline.generated.css'), compiler.build(keys.flatMap(key => recipes[key].split(/\s+/))))
const [command = 'build', target = 'all', ...args] = process.argv.slice(2)
if (!['build', 'dev', 'preview', 'baseline'].includes(command)) throw new Error('Expected build, dev, preview, or baseline')
if (command !== 'baseline') {
  if (!['all', 'react', 'vue', 'solid', 'svelte'].includes(target)) throw new Error('Expected react, vue, solid, svelte, or all')
  if (command !== 'build' && target === 'all') throw new Error('Choose one framework for dev/preview')
  for (const framework of target === 'all' ? ['react', 'vue', 'solid', 'svelte'] : [target]) {
    const result = spawnSync(process.execPath, [resolve(repo, 'node_modules/vite/bin/vite.js'), ...(command === 'dev' ? [] : [command]), '--config', `examples/vanilla-extract/${framework}/vite.config.ts`, ...args], { cwd: repo, stdio: 'inherit' })
    if (result.status !== 0) process.exit(result.status || 1)
  }
}

if (command === 'build' || command === 'baseline') {
  const measure = value => ({ rawBytes: Buffer.byteLength(value), gzipBytes: gzipSync(value).length })
  const css = await readFile(resolve(dirname(source), 'baseline.generated.css'))
  const classMap = Object.fromEntries(keys.map(key => [key, recipes[key]]))
  const recipeMapJavascript = await transformWithEsbuild(`export const classes = ${JSON.stringify(classMap)};`, 'baseline-classes.js', { minify: true, format: 'esm', target: 'es2022' })
  const recipeMapPath = 'artifacts/vanilla-extract/baseline-classes.js'
  const metadata = {
    scope: 'Switch, Dialog, Button and Label existing generated recipes only; shared --dy-* tokens; no Tailwind preflight',
    generatedCSS: measure(css),
    classMapJSON: measure(JSON.stringify(classMap)),
    recipeMapJavascript: { path: recipeMapPath, ...measure(recipeMapJavascript.code) },
    caveats: ['classMapJSON is serialized recipe strings, not a separately emitted JS module.', 'CSS includes Tailwind utility/property and animation support required by selected recipes.', 'Tokens and minimal scoped baseline reset live in shared fixture/package CSS and are excluded here.', 'Full consumer JS includes the framework, published Destyler primitives, both engines, and fixture UI; it is not styling runtime overhead.']
  }
  try {
    const assets = resolve(repo, 'dist/vanilla-extract/react/assets')
    const baseline = (await readdir(assets)).find(file => /^baseline-.*\.css$/.test(file))
    if (baseline) metadata.productionCSS = { path: `dist/vanilla-extract/react/assets/${baseline}`, ...measure(await readFile(resolve(assets, baseline))) }
  } catch {}
  await mkdir(resolve(repo, 'artifacts/vanilla-extract'), { recursive: true })
  await writeFile(resolve(repo, recipeMapPath), recipeMapJavascript.code)
  await writeFile(resolve(repo, 'artifacts/vanilla-extract/tailwind-baseline.json'), JSON.stringify(metadata, null, 2) + '\n')
}
