import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const [command = 'build', target = 'all', ...args] = process.argv.slice(2)
const frameworks = ['react', 'vue', 'solid', 'svelte', 'reference']
if (!['build', 'dev', 'preview'].includes(command)) throw Error('Expected build, dev, or preview')
if (target !== 'all' && !frameworks.includes(target)) throw Error('Unknown consumer')
if (target === 'all' && command !== 'build') throw Error('Choose one consumer for dev/preview')
for (const framework of target === 'all' ? frameworks : [target]) {
  const result = spawnSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), ...(command === 'dev' ? [] : [command]), '--config', `examples/css-only/${framework}/vite.config.ts`, ...args], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}
