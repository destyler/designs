// Optional compatibility matrix. Default consumers have no UnoCSS dependency.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { build } from 'vite'
import UnoCSS from 'unocss/vite'
import { presetWind3 } from 'unocss'
const root = fileURLToPath(new URL('../', import.meta.url))
const cases = []
for (const framework of ['react', 'vue', 'solid', 'svelte']) {
  const result = await build({
    configFile: join(root, `examples/css-only/${framework}/vite.config.ts`), logLevel: 'error',
    plugins: [
      { name: 'optional-uno-test-entry', enforce: 'pre', transform(code, id) {
        if (id === join(root, `examples/css-only/${framework}/main.${['react', 'solid'].includes(framework) ? 'tsx' : 'ts'}`)) return `import 'virtual:uno.css';\n${code}`
      } },
      UnoCSS({ configFile: false, presets: [presetWind3()], safelist: ['fixture-utility-override'], rules: [['fixture-utility-override', { 'border-radius': '0px', 'padding-left': '32px', 'padding-right': '32px' }]] }),
    ],
    build: { outDir: join(root, 'artifacts/css-only/unocss', framework), emptyOutDir: true },
  })
  const css = result.output.filter(file => file.type === 'asset' && file.fileName.endsWith('.css')).map(file => String(file.source)).join('')
  assert.match(css, /@layer destyler/)
  assert.match(css, /fixture-utility-override/)
  assert.match(css, /data-scope=.?switch/)
  cases.push({ framework, pass: true, cssOnlyPackageAndUnoCSSBuiltTogether: true })
}
const report = { pass: true, cases, limitations: ['Combined builds and generated selectors are checked. Effective cascade and visual states require browser verification.'] }
await mkdir(join(root, 'artifacts/css-only/unocss'), { recursive: true })
await writeFile(join(root, 'artifacts/css-only/unocss/verification.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
