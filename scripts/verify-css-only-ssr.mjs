// Build the actual bare consumer fixtures with each framework's standard plugin.
import { build } from 'vite'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import solid from 'vite-plugin-solid'
import { svelte } from '@sveltejs/vite-plugin-svelte'
const root = fileURLToPath(new URL('../', import.meta.url))
const out = join(root, 'artifacts/css-only/ssr')
await mkdir(out, { recursive: true })
const report = { cases: [], limitations: ['happy-dom verifies DOM hydration and click behavior, not rendered CSS, keyboard navigation, focus trapping, geometry, animations or browser accessibility. CSS build and visual checks are separate.'] }
for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  const fixture = join(root, `examples/css-only/${framework}/Example.${framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'tsx'}`)
  const fixtureSource = await readFile(fixture, 'utf8')
  if (/\b(?:className|class|style)\s*=|\b(?:classes|themes)\s*(?:as\s+\w+)?\s*[,}]/.test(fixtureSource)) throw new Error(`${framework}: fixture contains style/class maps or attributes`)
  // Each example owns one static package import. It adds no styling runtime.
  const primitiveSource = fixtureSource.replace(/^\s*import '@destyler\/designs-css-only-poc\/styles\.css'\s*$/m, '')
  if (/from\s*['"][^'"]*designs|import\s*['"][^'"]*\.css/.test(primitiveSource)) throw new Error(`${framework}: fixture imports unexpected styling code`)
  for (const mode of ['ssr', 'hydrate']) {
    let source = `import ${['react', 'solid'].includes(framework) ? '{ Example }' : 'Example'} from ${JSON.stringify(fixture)};\n`
    if (framework === 'react') source += `import { createElement } from 'react'; import { ${mode === 'ssr' ? 'renderToString' : 'hydrateRoot'} } from 'react-dom/${mode === 'ssr' ? 'server' : 'client'}'; export function run(target, onError) { const tree = createElement(Example); ${mode === 'ssr' ? 'return renderToString(tree)' : 'const app = hydrateRoot(target, tree, { onRecoverableError: onError }); return () => app.unmount()'}; }`
    if (framework === 'vue') source += `import { h, createSSRApp } from 'vue'; ${mode === 'ssr' ? "import { renderToString } from '@vue/server-renderer';" : ''} export function run(target) { const app = createSSRApp({ render: () => h(Example) }); ${mode === 'ssr' ? 'return renderToString(app)' : 'app.mount(target); return () => app.unmount()'}; }`
    if (framework === 'solid') source += `import { createComponent } from 'solid-js'; import { ${mode === 'ssr' ? 'renderToString, generateHydrationScript' : 'hydrate'} } from 'solid-js/web'; export function run(target) { return ${mode === 'ssr' ? 'renderToString' : 'hydrate'}(() => createComponent(Example, {})${mode === 'ssr' ? '' : ', target'}); } ${mode === 'ssr' ? 'export const hydrationScript = generateHydrationScript()' : ''}`
    if (framework === 'svelte') source += `${mode === 'ssr' ? "import { render } from 'svelte/server'" : "import { hydrate, unmount } from 'svelte'"}; export function run(target) { ${mode === 'ssr' ? 'return render(Example).body' : 'const app = hydrate(Example, { target, recover: false }); return () => unmount(app)'}; }`
    const sourcePath = join(out, `${framework}-${mode}-entry.mjs`)
    await writeFile(sourcePath, source)
    await build({ configFile: false, root, resolve: { alias: { '@destyler/designs-css-only-poc/styles.css': process.env.CSS_ONLY_PACKAGE_CSS || join(root, 'packages/css-only/styles.css') } }, logLevel: 'error', plugins: framework === 'react' ? [react()] : framework === 'vue' ? [vue()] : framework === 'solid' ? [solid({ ssr: true })] : [svelte({ configFile: false })], ssr: { noExternal: ['solid', 'svelte'].includes(framework) ? true : undefined }, build: { ssr: mode === 'ssr' ? sourcePath : false, outDir: out, emptyOutDir: false, minify: false, lib: mode === 'hydrate' ? { entry: sourcePath, formats: ['es'], fileName: () => `${framework}-${mode}.mjs` } : undefined, rollupOptions: { output: { entryFileNames: `${framework}-${mode}.mjs`, inlineDynamicImports: true } } } })
    const resultPath = join(out, `${framework}-${mode}.json`)
    execFileSync(process.execPath, ['test/css-only-ssr.mjs', framework, mode, out, resultPath], { cwd: root, encoding: 'utf8', timeout: 120_000 })
    const result = JSON.parse(await readFile(resultPath, 'utf8'))
    report.cases.push(result)
    console.log(JSON.stringify(result))
  }
}
report.pass = report.cases.length === 8 && report.cases.every(r => r.pass)
await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
if (!report.pass) process.exitCode = 1
