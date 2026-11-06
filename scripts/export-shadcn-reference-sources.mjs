import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, stat, realpath } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = join(root, 'examples/all-components/shadcn')
const vendor = join(root, 'vendor/shadcn')
const utils = join(root, 'examples/shadcn/lib/utils.ts')
const coverageFile = join(root, 'examples/all-components/shared/shadcn-coverage.json')
const { families } = JSON.parse(await readFile(join(root, 'examples/all-components/shared/catalog.json'), 'utf8'))
const coverage = JSON.parse(await readFile(coverageFile, 'utf8'))
const manifest = JSON.parse(await readFile(join(root, 'docs/shadcn-gallery-sources.json'), 'utf8'))
const destination = join(root, 'public/all-components/source/shadcn')
const allowed = path => path.startsWith(reference + sep) || path.startsWith(vendor + sep) || path === utils || path === coverageFile
const resolveFile = async path => {
  for (const extension of ['', '.tsx', '.ts', '.json', '.css']) {
    try {
      const file = await realpath(path + extension)
      if ((await stat(file)).isFile()) { assert.ok(allowed(file), `Unexpected reference source: ${file}`); return file }
    } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error }
  }
  throw new Error(`Missing reference source dependency: ${path}`)
}
async function collect(path, files = new Map()) {
  const file = await resolveFile(path)
  if (files.has(file)) return files
  const code = await readFile(file, 'utf8')
  files.set(file, { name: relative(root, file).split(sep).join('/'), code })
  for (const match of code.matchAll(/(?:from\s*|import\s*|@import\s*)['"]([^'"]+)['"]/g)) {
    const id = match[1]
    if (id.startsWith('.')) await collect(resolve(dirname(file), id), files)
    else if (id === 'cn') await collect(utils, files)
    else if (id.startsWith('@/registry/new-york-v4/ui/')) await collect(join(vendor, 'new-york-v4/ui', id.slice('@/registry/new-york-v4/ui/'.length)), files)
  }
  return files
}
await mkdir(destination, { recursive: true })
const totals = { direct: 0, composed: 0, none: 0 }
for (const family of families) {
  assert.ok(coverage[family], `Missing coverage for ${family}`)
  const files = await collect(join(reference, 'demos', family + '.tsx'))
  await collect(join(reference, 'reference.css'), files)
  await collect(join(vendor, 'zinc.css'), files)
  await collect(join(vendor, 'LICENSE'), files)
  const entry = coverage[family]
  assert.ok(Object.hasOwn(totals, entry.status))
  totals[entry.status]++
  await writeFile(join(destination, family + '.json'), JSON.stringify({ framework: 'shadcn', family, sourceCommit: manifest.commit, reference: entry, files: [...files.values()] }) + '\n')
}
assert.deepEqual(Object.keys(coverage).sort(), [...families].sort())
console.log(`Exported 46 truthful reference source sets: ${totals.direct} direct, ${totals.composed} composed, ${totals.none} unavailable.`)
