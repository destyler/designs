import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { build } from 'vite'
import solid from 'vite-plugin-solid'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '.verification')
await mkdir(out, { recursive: true })
const entry = join(out, 'entry.ts')
await writeFile(entry, `import { examples } from '../registry'; import { createComponent } from 'solid-js'; import { renderToString } from 'solid-js/web'; export function run() { return Object.entries(examples).map(([family, component]) => { try { const html = renderToString(() => createComponent(component, {})); return { family, pass: html.length > 0, htmlBytes: html.length }; } catch(error) { return {family, pass: false, error: String(error)}; } }); }`)
await build({
  configFile: false,
  root: here,
  logLevel: 'error',
  plugins: [solid({ ssr: true })],
  ssr: { noExternal: true },
  build: {
    ssr: entry,
    outDir: out,
    emptyOutDir: false,
    minify: false,
    rollupOptions: { output: { entryFileNames: 'registry.mjs', inlineDynamicImports: true } },
  },
})
const { run } = await import(`./.verification/registry.mjs?time=${Date.now()}`)
const result = run()
const catalog = JSON.parse(await readFile(join(here, '../shared/catalog.json'), 'utf8'))
assert.deepEqual(result.map(x => x.family), catalog.families)
await writeFile(join(out, 'ssr-results.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ framework: 'solid', passed: result.filter(x => x.pass).length, total: result.length, failures: result.filter(x => !x.pass) }, null, 2))
assert.equal(result.filter(x => !x.pass).length, 0)
