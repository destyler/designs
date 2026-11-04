// Compile the public framework packages exactly as framework consumers do.
// These are framework plugins, never vanilla-extract plugins.
import { build } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
export async function buildFrameworkProbes(root, artifacts) {
  const { default: solid } = await import('vite-plugin-solid')
  const { svelte } = await import('@sveltejs/vite-plugin-svelte')
  const out = join(artifacts, 'framework-probes')
  await mkdir(out, { recursive: true })
  for (const framework of ['solid', 'svelte']) {
    for (const mode of ['ssr', 'hydrate']) {
      const fixture = join(root, `test/vanilla-extract-${framework}.${framework === 'solid' ? 'tsx' : 'svelte'}`)
      const source = framework === 'solid'
        ? `import Probe from ${JSON.stringify(fixture)}; import { createComponent } from 'solid-js'; import { ${mode === 'ssr' ? 'renderToString, generateHydrationScript' : 'hydrate'} } from 'solid-js/web'; export function run(styles, target) { return ${mode === 'ssr' ? 'renderToString(() => createComponent(Probe, { styles }))' : 'hydrate(() => createComponent(Probe, { styles }), target)'}; } ${mode === 'ssr' ? 'export const hydrationScript = generateHydrationScript()' : ''}`
        : `import Probe from ${JSON.stringify(fixture)}; ${mode === 'ssr' ? "import { render } from 'svelte/server'" : "import { hydrate, unmount } from 'svelte'"}; export function run(styles, target) { ${mode === 'ssr' ? 'return render(Probe, { props: { styles } }).body' : 'const app = hydrate(Probe, { target, props: { styles }, recover: false }); return () => unmount(app)'}; }`
      const entry = join(out, `${framework}-${mode}-entry.mjs`)
      await writeFile(entry, source)
      await build({ configFile: false, root, logLevel: 'error',
        plugins: framework === 'solid' ? [solid({ ssr: true })] : [svelte({ configFile: false })],
        ssr: { noExternal: true },
        build: { ssr: mode === 'ssr' ? entry : false, outDir: out, emptyOutDir: false, minify: false,
          lib: mode === 'hydrate' ? { entry, formats: ['es'], fileName: () => `${framework}-${mode}.mjs` } : undefined,
          rollupOptions: { output: { entryFileNames: `${framework}-${mode}.mjs`, inlineDynamicImports: true } } }
      })
    }
  }
}
