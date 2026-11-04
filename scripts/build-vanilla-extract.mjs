import { rollup } from 'rollup'
import { transform } from 'esbuild'
import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import config from '../packages/vanilla-extract/rollup.config.mjs'
const dir = 'packages/vanilla-extract/dist'
await rm(dir, { recursive: true, force: true })
await mkdir(dir, { recursive: true })
const bundle = await rollup(config)
await bundle.write(config.output)
await bundle.close()
for (const [file, loader] of [['styles.css', 'css'], ['index.js', 'js']]) {
  const source = await readFile(`${dir}/${file}`, 'utf8')
  const result = await transform(source, { loader, minify: true, legalComments: 'inline', target: 'es2022' })
  await writeFile(`${dir}/${file}`, result.code)
}
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--declaration', '--emitDeclarationOnly', '--skipLibCheck', '--strict', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--outDir', dir, 'packages/vanilla-extract/src/index.ts'], { stdio: 'inherit' })
await copyFile(`${dir}/styles.css.d.ts`, `${dir}/index.d.ts`)
await rm(`${dir}/styles.css.d.ts`)
await copyFile('vendor/shadcn/LICENSE', `${dir}/SHADCN-LICENSE`)
await writeFile(`${dir}/THIRD_PARTY_NOTICES.txt`, 'Switch/Dialog styles derived from shadcn/ui New York at 4aaea19d9cff3e0908e12a8c1d504b8c5ec34610. See SHADCN-LICENSE.\n')
console.log('Built precompiled CSS, plain ESM class/token exports, and declarations.')
