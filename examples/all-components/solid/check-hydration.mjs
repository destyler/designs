import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import solid from 'vite-plugin-solid'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '.verification')
await mkdir(out, { recursive: true })
for (const mode of ['ssr', 'hydrate']) {
  const entry = join(out, `${mode}-entry.ts`)
  await writeFile(entry, `import { examples } from '../registry'; import { createComponent } from 'solid-js'; import { ${mode === 'ssr' ? 'renderToString, generateHydrationScript' : 'hydrate'} } from 'solid-js/web'; export function run(family, target) { return ${mode === 'ssr' ? 'renderToString(() => createComponent(examples[family], {}))' : 'hydrate(() => createComponent(examples[family], {}), target)'}; } ${mode === 'ssr' ? 'export const bootstrap = generateHydrationScript()' : ''}`)
  await build({
    configFile: false, root: here, logLevel: 'warn', plugins: [solid({ ssr: true, dev: true, hot: false })], ssr: { noExternal: true },
    build: {
      ssr: mode === 'ssr' ? entry : false, outDir: out, emptyOutDir: false, minify: false,
      lib: mode === 'hydrate' ? { entry, formats: ['es'], fileName: () => `${mode}.mjs` } : undefined,
      rollupOptions: { output: { entryFileNames: `${mode}.mjs`, inlineDynamicImports: true } },
    },
  })
}
const { families } = JSON.parse(await readFile(join(here, '../shared/catalog.json'), 'utf8'))
const results = []
for (const family of families) {
  await rm(join(out, `${family}.json`), { force: true })
  await rm(join(out, `${family}-ssr.json`), { force: true })
  await rm(join(out, `${family}.html`), { force: true })
  const executionFailures = []
  for (const mode of ['ssr', 'hydrate']) {
    try {
      execFileSync(process.execPath, [join(here, 'hydration-case.mjs'), mode, family], { encoding: 'utf8', timeout: 15_000, stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (error) {
      executionFailures.push({ mode, error: error.message })
      console.error(`${family} ${mode}: ${error.message}`)
    }
  }
  let result
  try { result = JSON.parse(await readFile(join(out, `${family}.json`), 'utf8')) }
  catch (error) { result = { family, pass: false, error: String(error) } }
  if (executionFailures.length) { result.pass = false; result.executionFailures = executionFailures }
  results.push(result)
  console.log(`${family}: ${result.pass ? 'PASS' : 'FAIL'}${result.error ? ` ${result.error}` : ''}`)
}
const report = { framework: 'solid', environment: 'Happy DOM (not a browser)', generatedAt: new Date().toISOString(), passed: results.filter(x => x.pass).length, total: results.length, results, limitations: ['No browser layout, pointer geometry, visual output, or real focus verification.', 'File picker, clipboard permission, color eyedropper, and signature drawing are not exercised.'] }
await writeFile(join(out, 'hydration-results.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ passed: report.passed, total: report.total }))
assert.equal(report.passed, families.length, 'Every Solid example must hydrate without warnings/errors and retain meaningful server nodes')
