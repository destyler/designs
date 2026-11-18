// Creates files only. Run npm install/build/check yourself in the printed directory.
import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const [framework, destination, archive] = process.argv.slice(2)
const configs = {
  react: { deps: ['react', 'react-dom', '@types/react', '@types/react-dom', '@vitejs/plugin-react'], plugin: "import plugin from '@vitejs/plugin-react'", check: 'tsc --noEmit', jsx: 'react-jsx' },
  solid: { deps: ['solid-js', 'vite-plugin-solid'], plugin: "import plugin from 'vite-plugin-solid'", check: 'tsc --noEmit', jsx: 'preserve', jsxImportSource: 'solid-js' },
  vue: { deps: ['vue', '@vitejs/plugin-vue', 'vue-tsc'], plugin: "import plugin from '@vitejs/plugin-vue'", check: 'vue-tsc --noEmit' },
  svelte: { deps: ['svelte', '@sveltejs/vite-plugin-svelte', 'svelte-check'], plugin: "import {svelte as plugin} from '@sveltejs/vite-plugin-svelte'", check: 'svelte-check --tsconfig ./tsconfig.json' },
}
if (!Object.hasOwn(configs, framework) || !destination || !archive) throw Error('Usage: node scripts/create-ready-consumer.mjs react|vue|solid|svelte EMPTY_DIRECTORY /absolute/package.tgz')
const config = configs[framework], cwd = resolve(destination), tarball = resolve(archive)
if (!(await stat(tarball)).isFile()) throw Error('Expected a local tarball file')
await mkdir(cwd, { recursive: true })
if ((await readdir(cwd)).length) throw Error('Destination must be empty; existing files will not be overwritten')
const versions = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const dependencies = Object.fromEntries(['vite', 'typescript', `@destyler-ui/${framework}`, ...config.deps].map(name => {
  const version = versions.dependencies?.[name] ?? versions.devDependencies?.[name]
  if (!version) throw Error(`Missing pinned version for ${name}`)
  return [name, version]
}))
dependencies['@destyler/ready-prototype'] = `file:${tarball}`
await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: `ready-${framework}-consumer`, private: true, type: 'module', scripts: { dev: 'vite --host 127.0.0.1', build: 'vite build', check: config.check }, dependencies }, null, 2))
await writeFile(join(cwd, 'vite.config.mjs'), `${config.plugin}\nexport default { plugins: [plugin()] }\n`)
await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022','DOM','DOM.Iterable'], module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: true, noEmit: true, esModuleInterop: true, isolatedModules: true, allowJs: framework === 'svelte', types: ['vite/client'], ...(config.jsx ? { jsx: config.jsx } : {}), ...(config.jsxImportSource ? { jsxImportSource: config.jsxImportSource } : {}) }, include: ['*.ts','*.tsx','*.vue','*.svelte'], exclude: ['node_modules','dist'] }, null, 2))
if (framework === 'svelte') await writeFile(join(cwd, 'svelte.config.js'), 'export default {}\n')
const markdown = await readFile(join(root, 'docs/ready-quickstart.md'), 'utf8')
let files = 0
for (const match of markdown.matchAll(/```\w+ file=(common|react|vue|solid|svelte)\/([\w.-]+)\n([\s\S]*?)\n```/g)) {
  if (match[1] !== 'common' && match[1] !== framework) continue
  await writeFile(join(cwd, match[2]), `${match[3]}\n`); files++
}
if (files < 3) throw Error('Documented consumer source blocks are missing')
console.log(`Created documented ${framework} consumer in ${cwd}. Run npm install, npm run check, npm run build there.`)
