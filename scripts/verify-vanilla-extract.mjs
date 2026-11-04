import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, writeFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'
import { buildFrameworkProbes } from '../test/vanilla-extract-build-probes.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const artifacts = join(root, 'artifacts/vanilla-extract')
await mkdir(artifacts, { recursive: true })
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, env: { ...process.env, npm_config_cache: join(tmpdir(), 'destyler-ve-npm-cache') }, encoding: 'utf8', timeout: 120_000, maxBuffer: 10 * 1024 * 1024 })
const size = data => ({ rawBytes: Buffer.byteLength(data), gzipBytes: gzipSync(data, { level: 9 }).byteLength })
const report = { generatedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform }, distribution: {}, ssr: [], sizes: {}, limitations: [] }
report.frameworks = {}
for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  const manifest = JSON.parse(await readFile(join(root, `node_modules/@destyler-ui/${framework}/package.json`), 'utf8'))
  report.frameworks[framework] = { package: manifest.name, version: manifest.version, source: `https://github.com/destyler/ui/tree/main/packages/${framework}` }
}
const packageRoot = join(root, 'packages/vanilla-extract')
const packed = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', artifacts], packageRoot))[0]
const tarball = join(artifacts, packed.filename)
report.distribution.pack = { filename: packed.filename, integrity: packed.integrity, files: packed.files.map(f => f.path), unpackedBytes: packed.unpackedSize, tarballBytes: (await stat(tarball)).size }
assert.ok(packed.files.some(f => f.path === 'dist/styles.css'))
assert.ok(!packed.files.some(f => /\.css\.ts$|node_modules/.test(f.path)), 'Published files must contain no authoring source/dependencies')
const isolated = await mkdtemp(join(tmpdir(), 'destyler-ve-consumer-'))
await writeFile(join(isolated, 'package.json'), JSON.stringify({ name: 'isolated-distribution-verification', private: true, type: 'module' }))
run('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', tarball], isolated)
const installed = join(isolated, 'node_modules/@destyler/designs-vanilla-extract-poc')
const manifest = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'))
assert.equal(Object.keys(manifest.dependencies || {}).length, 0, 'Style artifact must not require runtime dependencies')
assert.equal(Object.keys(manifest.peerDependencies || {}).length, 0, 'Style artifact must not require consumer peers')
const importProbe = `import assert from 'node:assert/strict'; import {classes,themes,vars} from '@destyler/designs-vanilla-extract-poc'; assert.equal(typeof window,'undefined'); assert.ok(classes.switchControl); assert.ok(classes.dialogContent); assert.ok(themes.light); assert.ok(themes.dark); assert.ok(vars.background); for (const name of ['@vanilla-extract/css','@vanilla-extract/vite-plugin']) { let missing = false; try { import.meta.resolve(name) } catch { missing = true } assert.ok(missing, name + ' unexpectedly installed') } console.log(JSON.stringify({classes,themes,vars,domRequired:false,vanillaExtractInstalled:false}));`
await writeFile(join(isolated, 'probe.mjs'), importProbe)
report.distribution.staticImport = JSON.parse(run(process.execPath, ['probe.mjs'], isolated))
report.distribution.installedPackage = manifest.name
await writeFile(join(isolated, 'probe.ts'), `import { classes, themes, vars } from '@destyler/designs-vanilla-extract-poc'; const checked: string[] = [classes.switchControl, classes.dialogContent, themes.light, vars.background]; void checked;`)
report.distribution.types = []
for (const resolution of ['bundler', 'NodeNext']) {
  run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', 'false', '--target', 'ES2022', '--module', resolution === 'bundler' ? 'ESNext' : 'NodeNext', '--moduleResolution', resolution, 'probe.ts'], isolated)
  report.distribution.types.push({ resolution, pass: true, vanillaExtractTypesInstalled: false })
}
const entry = join(installed, 'dist/index.js')
const js = await readFile(entry)
const css = await readFile(join(installed, 'dist/styles.css'))
assert.ok(!/vanilla-extract|createTheme\(|style\(/.test(js.toString()), 'No authoring runtime in distributed JS')
report.sizes.stylePackage = { javascript: size(js), css: size(css), combined: size(Buffer.concat([js, css])), packedTarballBytes: (await stat(tarball)).size }
await writeFile(join(isolated, 'index.html'), '<!doctype html><html><body><div id="app"></div><script type="module" src="/main.js"></script></body></html>')
await writeFile(join(isolated, 'main.js'), `import {classes,themes} from '@destyler/designs-vanilla-extract-poc'; import '@destyler/designs-vanilla-extract-poc/styles.css'; document.querySelector('#app').className=themes.light; document.querySelector('#app').innerHTML='<button class="'+classes.button+'">Packed consumer</button>';`)
const bareOutput = await build({ configFile: false, root: isolated, logLevel: 'silent', plugins: [], build: { outDir: join(artifacts, 'plain-consumer'), emptyOutDir: true } })
report.distribution.plainViteConsumer = { pass: true, vanillaExtractPlugin: false, output: bareOutput.output.map(f => ({ file: f.fileName, ...size(f.type === 'chunk' ? f.code : f.source) })) }
await buildFrameworkProbes(root, artifacts)
for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  for (const variant of ['styled', 'unstyled']) {
    const htmlFile = join(artifacts, `${framework}-${variant}-ssr.html`)
    for (const mode of ['ssr', 'hydrate']) {
      const resultFile = join(artifacts, `${framework}-${variant}-${mode}.json`)
      run(process.execPath, ['test/vanilla-extract-ssr.mjs', framework, mode, entry, resultFile, htmlFile, variant, join(artifacts, 'framework-probes')])
      report.ssr.push(JSON.parse(await readFile(resultFile, 'utf8')))
    }
  }
}
for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  for (const mode of ['ssr', 'hydrate']) {
    const styled = report.ssr.find(r => r.framework === framework && r.mode === mode && r.variant === 'styled')
    const unstyled = report.ssr.find(r => r.framework === framework && r.mode === mode && r.variant === 'unstyled')
    styled.classification = styled.pass ? 'passed' : unstyled.pass ? 'styling-or-packed-consumer-regression' : 'also-fails-without-styles-investigate-primitive-or-harness'
  }
}
async function collect(dir) {
  const files = []
  for (const item of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = join(dir, item.name)
    if (item.isDirectory()) files.push(...await collect(p))
    else if (/\.(css|js)$/.test(p)) files.push({ file: relative(root, p), ...size(await readFile(p)) })
  }
  return files
}
report.sizes.fullDemoBuildContextOnly = await collect(join(root, 'dist/assets'))
report.sizes.consumerBuildsContextOnly = { react: await collect(join(root, 'dist/vanilla-extract/react')), vue: await collect(join(root, 'dist/vanilla-extract/vue')), solid: await collect(join(root, 'dist/vanilla-extract/solid')), svelte: await collect(join(root, 'dist/vanilla-extract/svelte')) }
try { report.sizes.tailwindSwitchDialogBaseline = JSON.parse(await readFile(join(artifacts, 'tailwind-baseline.json'), 'utf8')) } catch { report.limitations.push('Tailwind Switch/Dialog baseline not generated yet. Run its baseline script, then rerun this verification. Full demo asset sizes are context only, never an equivalent comparison.') }
report.limitations.push('Hydration and interactions use happy-dom, not a browser layout engine. This does not verify visual parity, focus trapping, keyboard navigation, nested themes, or portaled theme inheritance.')
report.limitations.push('Style package sizes exclude React/Vue, Destyler primitives and application code. Raw and gzip sizes are measured independently per artifact. Existing Tailwind recipes include additional variants and animations; component-scoped baseline is scope-matched, not byte-identical feature parity.')
report.pass = report.ssr.every(r => r.pass)
await writeFile(join(artifacts, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ pass: report.pass, distribution: report.distribution.pack, sizes: report.sizes.stylePackage, ssr: report.ssr.map(({ framework, variant, mode, pass, classification }) => ({ framework, variant, mode, pass, classification })), report: 'artifacts/vanilla-extract/verification.json' }, null, 2))
if (!report.pass) process.exitCode = 1
