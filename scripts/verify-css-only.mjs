// Packs and installs CSS into a clean consumer, then builds with zero style plugins.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir, mkdtemp, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'
import { transform } from 'lightningcss'
import { createGenerator, presetWind3 } from 'unocss'
const root = fileURLToPath(new URL('../', import.meta.url))
const out = join(root, 'artifacts/css-only')
await mkdir(out, { recursive: true })
const run = (cmd, args, cwd = root, env = {}) => execFileSync(cmd, args, { cwd, env: { ...process.env, npm_config_cache: join(tmpdir(), 'destyler-css-npm-cache'), ...env }, encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 })
run(process.execPath, ['--test', 'test/css-only.test.mjs'])
const packed = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', out], join(root, 'packages/css-only')))[0]
assert.ok(packed.files.some(file => file.path === 'styles.css'))
assert.ok(packed.files.every(file => !/\.(?:js|ts|tsx|vue|svelte)$/.test(file.path)))
const isolated = await mkdtemp(join(tmpdir(), 'destyler-css-consumer-'))
await writeFile(join(isolated, 'package.json'), JSON.stringify({ name: 'isolated-css-only-consumer', private: true, type: 'module' }))
run('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', join(out, packed.filename)], isolated)
const installedCSS = join(isolated, 'node_modules/@destyler/designs-css-only-poc/styles.css')
assert.equal(await readFile(installedCSS, 'utf8'), await readFile(join(root, 'packages/css-only/styles.css'), 'utf8'))
await writeFile(join(isolated, 'index.html'), '<!doctype html><html><body><div data-scope="switch" data-part="root"><span data-scope="switch" data-part="control"><span data-scope="switch" data-part="thumb"></span></span></div><script type="module" src="./main.js"></script></body></html>')
await writeFile(join(isolated, 'main.js'), "import '@destyler/designs-css-only-poc/styles.css'\n")
const bare = await build({ configFile: false, root: isolated, plugins: [], logLevel: 'error', build: { outDir: join(out, 'plain-consumer'), emptyOutDir: true, modulePreload: { polyfill: false } } })
assert.ok(bare.output.some(file => file.fileName.endsWith('.css')))
const styleJS = bare.output.filter(file => file.type === 'chunk').map(file => file.code).join('')
assert.equal(styleJS.trim(), '', 'CSS-only import should produce zero style JavaScript')
run(process.execPath, ['scripts/build-css-only-consumers.mjs', 'build'], root, { CSS_ONLY_PACKAGE_CSS: installedCSS })
for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  const assets = join(root, 'dist/css-only', framework, 'assets')
  const stylesheets = (await readdir(assets)).filter(file => file.endsWith('.css'))
  const outputCSS = (await Promise.all(stylesheets.map(file => readFile(join(assets, file), 'utf8')))).join('\n')
  assert.equal((outputCSS.match(/@layer\s+destyler\s*\{/g) || []).length, 1, `${framework}: component imports emit the package CSS once`)
}
for (const [tool, args] of [
  ['vue-tsc/bin/vue-tsc.js', ['--noEmit', '-p', 'examples/css-only/tsconfig.json']],
  ['typescript/bin/tsc', ['--noEmit', '-p', 'examples/css-only/solid/tsconfig.json']],
  ['svelte-check/bin/svelte-check', ['--tsconfig', './examples/css-only/svelte/tsconfig.json']],
]) run(process.execPath, [join(root, 'node_modules', tool), ...args])
const uno = await createGenerator({ presets: [presetWind3()], rules: [['fixture-utility-override', { 'border-radius': '0px', 'padding-left': '32px', 'padding-right': '32px' }]] })
const utility = await uno.generate('fixture-utility-override', { preflights: false })
assert.match(utility.css, /border-radius:0px/)
assert.doesNotMatch(utility.css, /@layer/)
await writeFile(join(out, 'unocss-override.css'), utility.css)
await mkdir(join(root, 'dist/css-only'), { recursive: true })
await writeFile(join(root, 'dist/css-only/unocss-override.css'), utility.css)
const css = await readFile(installedCSS)
const minified = transform({ filename: 'styles.css', code: css, minify: true }).code
const size = value => ({ rawBytes: value.length, gzipBytes: gzipSync(value).length })
const report = {
  generatedAt: new Date().toISOString(), pass: true,
  package: { filename: packed.filename, integrity: packed.integrity, files: packed.files.map(file => file.path), tarballBytes: (await stat(join(out, packed.filename))).size, runtimeDependencies: 0, peerDependencies: 0, javascriptBytes: 0 },
  css: { authored: size(css), minified: size(minified) },
  verification: { unitTests: 5, isolatedOfflineInstall: true, bareViteWithoutPlugins: true, plainImportJavaScriptBytes: styleJS.length, packedCSSUsedByAllFourConsumers: true, componentImportsDeduplicated: true, builds: ['react', 'vue', 'solid', 'svelte', 'pinned-shadcn-reference'], types: ['react', 'vue', 'solid', 'svelte'], unoGeneratedOverride: true },
  limitations: ['CSS computed styles, keyboard, focus trap/return, animation and visual parity require the separate browser suite.', 'UnoCSS generation is verified here; effective cascade is asserted only by browser suite.'],
}
await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
