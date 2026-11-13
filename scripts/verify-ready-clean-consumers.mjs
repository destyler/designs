// Opt-in network verification, not part of the offline unit test suite.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const documented = process.argv.includes('--documented')
const root = fileURLToPath(new URL('../', import.meta.url))
const folder = await mkdtemp('/tmp/ready-clean-consumers-')
console.log(`Consumer evidence: ${folder}`)
const run = (command, args, cwd) => execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_PATH: '' } })
const [packed] = JSON.parse(run('npm', ['pack', './packages/ready', '--json', '--ignore-scripts', '--pack-destination', folder, '--cache', '/tmp/ready-clean-npm-cache'], root))
const versions = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const configurations = {
  react: { packages: ['react', 'react-dom', '@vitejs/plugin-react', '@types/react', '@types/react-dom'], plugin: "import plugin from '@vitejs/plugin-react'", pluginCall: 'plugin()', check: ['typescript/bin/tsc', '--noEmit'] },
  vue: { packages: ['vue', '@vitejs/plugin-vue', 'vue-tsc'], plugin: "import plugin from '@vitejs/plugin-vue'", pluginCall: 'plugin()', check: ['vue-tsc/bin/vue-tsc.js', '--noEmit'] },
  solid: { packages: ['solid-js', 'vite-plugin-solid'], plugin: "import plugin from 'vite-plugin-solid'", pluginCall: 'plugin()', check: ['typescript/bin/tsc', '--noEmit'] },
  svelte: { packages: ['svelte', '@sveltejs/vite-plugin-svelte', 'svelte-check'], plugin: "import {svelte as plugin} from '@sveltejs/vite-plugin-svelte'", pluginCall: 'plugin()', check: ['svelte-check/bin/svelte-check', '--tsconfig', './tsconfig.json'] },
}
const results = []
for (const [framework, config] of Object.entries(configurations)) {
  const cwd = join(folder, framework)
  await mkdir(cwd)
  const dependencies = Object.fromEntries(['vite', 'typescript', `@destyler-ui/${framework}`, ...config.packages].map(name => [name, versions.dependencies?.[name] ?? versions.devDependencies[name]]))
  for (const [name, version] of Object.entries(dependencies)) assert.ok(version, `Missing exact version: ${name}`)
  dependencies['@destyler/ready-prototype'] = `file:${join(folder, packed.filename)}`
  if (documented) run('node', [join(root, 'scripts/create-ready-consumer.mjs'), framework, cwd, join(folder, packed.filename)], root)
  else await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: `ready-clean-${framework}`, private: true, type: 'module', dependencies }, null, 2))
  try {
    await writeFile(join(cwd, 'install.log'), run('npm', ['install', '--no-audit', '--no-fund', '--cache', '/tmp/ready-clean-npm-cache', '--fetch-retries=0', '--fetch-timeout=30000'], cwd))
    if (!documented) {
    for (const file of await readdir(join(root, 'examples/ready', framework))) {
      if (file === 'tsconfig.json') continue
      const source = (await readFile(join(root, 'examples/ready', framework, file), 'utf8')).replaceAll('../../../packages/ready/', '@destyler/ready-prototype/').replaceAll('../demo.css', './demo.css')
      await writeFile(join(cwd, file), source)
    }
    await writeFile(join(cwd, 'demo.css'), await readFile(join(root, 'examples/ready/demo.css')))
    const tsconfig = JSON.parse(await readFile(join(root, 'examples/ready', framework, 'tsconfig.json'), 'utf8'))
    tsconfig.include = ['*.ts', '*.tsx', '*.vue', '*.svelte']
    tsconfig.exclude = ['node_modules', 'dist']
    await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))
    await writeFile(join(cwd, 'vite.config.mjs'), `${config.plugin};\nexport default {plugins:[${config.pluginCall}],build:{minify:false}}`)
    }
    const resolveScript = `import assert from 'node:assert/strict';for(const name of ${JSON.stringify([`@destyler/ready-prototype/${framework}`, '@destyler/ready-prototype/theme.css', ...[`@destyler-ui/${framework}`, ...config.packages.filter(n => ['react', 'react-dom', 'vue', 'solid-js', 'svelte'].includes(n))]])}){const path=import.meta.resolve(name);assert.ok(path.startsWith(new URL('./node_modules/', import.meta.url).href),path);console.log(name,path)}`
    await writeFile(join(cwd, 'resolve.mjs'), resolveScript)
    await writeFile(join(cwd, 'resolve.log'), run('node', ['resolve.mjs'], cwd))
    const adapters = await readdir(join(cwd, 'node_modules/@destyler-ui'))
    assert.deepEqual(adapters, [framework], 'Only the selected UI adapter is installed')
    await writeFile(join(cwd, 'peer-tree.json'), run('npm', ['ls', '--all', '--json'], cwd))
    await writeFile(join(cwd, 'build.log'), documented ? run('npm', ['run', 'build'], cwd) : run('node', ['node_modules/vite/bin/vite.js', 'build'], cwd))
    const assets = join(cwd, 'dist/assets')
    const css = (await Promise.all((await readdir(assets)).filter(name => name.endsWith('.css')).map(name => readFile(join(assets, name), 'utf8')))).join('\n')
    assert.match(css, /--rd-accent/)
    assert.match(css, /--rd-backdrop/)
    if (documented) {
      assert.match(css, /--rd-accent:\s*#5b21b6/)
      assert.match(css, /--rd-on-accent:\s*#fff/)
      assert.match(css, /--rd-radius:\s*16px/)
    }
    if (documented) assert.match(await readFile(join(cwd, 'dist/index.html'), 'utf8'), /data-rd-theme="default"/)
    await writeFile(join(cwd, 'types.log'), documented ? run('npm', ['run', 'check'], cwd) : run('node', [`node_modules/${config.check[0]}`, ...config.check.slice(1)], cwd))
    results.push({ framework, install: 'pass', build: 'pass', types: 'pass', adapters })
  } catch (error) {
    const detail = `${error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`
    await writeFile(join(cwd, 'failure.log'), detail)
    results.push({ framework, error: detail })
  }
  console.log(JSON.stringify(results.at(-1)))
  await writeFile(join(folder, 'results.json'), JSON.stringify(results, null, 2))
}
if (results.some(result => result.error)) process.exitCode = 1
