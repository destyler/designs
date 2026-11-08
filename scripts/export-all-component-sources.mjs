import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, stat, copyFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const sourceRoot = join(root, 'examples/all-components')
const destination = join(root, 'public/all-components/source')
const catalog = JSON.parse(await readFile(join(sourceRoot, 'shared/catalog.json'), 'utf8'))
const extensions = ['', '.tsx', '.ts', '.vue', '.svelte', '.css']
async function resolveFile(path) {
  for (const extension of extensions) {
    const file = path + extension
    try { if ((await stat(file)).isFile()) return file } catch {}
  }
  throw new Error(`Missing relative example dependency: ${path}`)
}
async function collect(file, boundary, files = new Map()) {
  const exact = await resolveFile(file)
  assert.ok(exact.startsWith(boundary + sep), 'Source export remains within its framework directory')
  if (files.has(exact)) return files
  const code = await readFile(exact, 'utf8')
  files.set(exact, { name: relative(boundary, exact).split(sep).join('/'), code })
  for (const match of code.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) await collect(resolve(dirname(exact), match[1]), boundary, files)
  return files
}
const exported = []
for (const framework of catalog.frameworks) {
  const boundary = join(sourceRoot, framework)
  const out = join(destination, framework)
  await mkdir(out, { recursive: true })
  for (const family of catalog.families) {
    const path = framework === 'svelte' ? join(boundary, family + '.svelte') : join(boundary, ...(['react', 'solid'].includes(framework) ? ['components'] : []), family, 'Basic')
    const files = [...(await collect(path, boundary)).values()]
    await writeFile(join(out, family + '.json'), JSON.stringify({ framework, family, sourceCommit: catalog.sourceCommit, reconstruction: true, files }) + '\n')
    exported.push({ framework, family, files: files.map(file => file.name) })
  }
}
assert.equal(exported.length, 184)
await copyFile(join(sourceRoot, 'shared/theme.css'), join(destination, 'theme.css'))
const cssOnlyFiles = await Promise.all(['examples/all-components/shared/css-only-gallery.css', 'packages/css-only/styles.css'].map(async repositoryPath => ({ name: repositoryPath, repositoryPath, code: await readFile(join(root, repositoryPath), 'utf8') })))
await writeFile(join(destination, 'css-only-gallery.json'), JSON.stringify({ files: cssOnlyFiles }) + '\n')
await writeFile(join(destination, 'catalog.json'), JSON.stringify({ ...catalog, examples: exported }, null, 2) + '\n')
console.log(`Exported ${exported.length} actual example source sets and one shared CSS file.`)

// Export the independently styled pinned shadcn references, with explicit coverage.
await import('./export-shadcn-reference-sources.mjs')
