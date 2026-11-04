// Actual consumer adapters: separate server/client builds, packed styles, no VE plugin.
import { build } from 'vite'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import solid from 'vite-plugin-solid'
import { svelte } from '@sveltejs/vite-plugin-svelte'
const root = fileURLToPath(new URL('../', import.meta.url))
const out = join(root, 'artifacts/astro/rendering')
await mkdir(out, { recursive: true })
const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', out], { cwd: join(root, 'packages/vanilla-extract'), env: { ...process.env, npm_config_cache: join(tmpdir(), 'destyler-ve-npm-cache') }, encoding: 'utf8' }))[0]
const unpacked = await mkdtemp(join(tmpdir(), 've-panel-package-'))
execFileSync('tar', ['-xzf', join(out, packed.filename), '-C', unpacked])
const entry = join(unpacked, 'package/dist/index.js')
const report = { packageIntegrity: packed.integrity, cases: [], limitations: ['happy-dom tests DOM behavior, not visual parity, keyboard navigation or focus trapping.'] }
for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  for (const mode of ['ssr', 'hydrate']) {
    const fixture = join(root, `examples/vanilla-extract/${framework}/Showcase.${framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'tsx'}`)
    const props = `{}`
    let source = `import ${['react', 'solid'].includes(framework) ? '{ Showcase }' : 'Showcase'} from ${JSON.stringify(fixture)};\n`
    if (framework === 'react') source += `import { createElement } from 'react'; import { ${mode === 'ssr' ? 'renderToString' : 'hydrateRoot'} } from 'react-dom/${mode === 'ssr' ? 'server' : 'client'}'; export function run(target, onError) { const tree = createElement(Showcase, ${props}); ${mode === 'ssr' ? 'return renderToString(tree)' : 'const app = hydrateRoot(target, tree, { onRecoverableError: onError }); return () => app.unmount()'}; }`
    if (framework === 'vue') source += `import { h, createSSRApp } from 'vue'; ${mode === 'ssr' ? "import { renderToString } from '@vue/server-renderer';" : ''} export function run(target) { const app = createSSRApp({ render: () => h(Showcase, ${props}) }); ${mode === 'ssr' ? 'return renderToString(app)' : 'app.mount(target); return () => app.unmount()'}; }`
    if (framework === 'solid') source += `import { createComponent } from 'solid-js'; import { ${mode === 'ssr' ? 'renderToString, generateHydrationScript' : 'hydrate'} } from 'solid-js/web'; export function run(target) { return ${mode === 'ssr' ? 'renderToString' : 'hydrate'}(() => createComponent(Showcase, ${props})${mode === 'ssr' ? '' : ', target'}); } ${mode === 'ssr' ? 'export const hydrationScript = generateHydrationScript()' : ''}`
    if (framework === 'svelte') source += `${mode === 'ssr' ? "import { render } from 'svelte/server'" : "import { hydrate, unmount } from 'svelte'"}; export function run(target) { ${mode === 'ssr' ? `return render(Showcase, { props: ${props} }).body` : `const app = hydrate(Showcase, { target, props: ${props}, recover: false }); return () => unmount(app)`}; }`
    const sourcePath = join(out, `${framework}-${mode}-entry.mjs`)
    await writeFile(sourcePath, source)
    await build({ configFile: false, root, logLevel: 'error', plugins: framework === 'react' ? [react()] : framework === 'vue' ? [vue()] : framework === 'solid' ? [solid({ ssr: true })] : [svelte({ configFile: false })], resolve: { alias: { '@destyler/designs-vanilla-extract-poc': entry } }, ssr: { noExternal: ['solid', 'svelte'].includes(framework) ? true : undefined }, build: { ssr: mode === 'ssr' ? sourcePath : false, outDir: out, emptyOutDir: false, minify: false, lib: mode === 'hydrate' ? { entry: sourcePath, formats: ['es'], fileName: () => `${framework}-${mode}.mjs` } : undefined, rollupOptions: { output: { entryFileNames: `${framework}-${mode}.mjs`, inlineDynamicImports: true } } } })
    const resultPath = join(out, `${framework}-${mode}.json`)
    execFileSync(process.execPath, ['test/showcase-rendering.mjs', framework, mode, out, entry, resultPath], { cwd: root, encoding: 'utf8', timeout: 120_000 })
    const result = JSON.parse(await readFile(resultPath, 'utf8'))
    report.cases.push(result)
    console.log(JSON.stringify(result))
  }
}
report.pass = report.cases.every(r => r.pass)
await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
if (!report.pass) process.exitCode = 1
