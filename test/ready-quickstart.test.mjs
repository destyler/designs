import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))

test('Ready documented consumer generator is offline, scoped and refuses overwrite', async () => {
  const folder = await mkdtemp('/tmp/ready-guide-contract-')
  try {
    // Generator writes a local dependency reference, never installs or reads archive contents.
    const archive = join(folder, 'sample.tgz'); await writeFile(archive, '')
    const generate = (framework, destination) => spawnSync(process.execPath, [join(root, 'scripts/create-ready-consumer.mjs'), framework, destination, archive], { cwd: root, encoding: 'utf8' })
    for (const invalid of ['unknown', 'constructor', 'toString']) assert.notEqual(generate(invalid, join(folder, 'invalid')).status, 0)
    assert.equal((await readdir(folder)).includes('invalid'), false)
    for (const framework of ['react', 'vue', 'solid', 'svelte']) {
      const destination = join(folder, framework)
      assert.equal(generate(framework, destination).status, 0)
      const manifest = JSON.parse(await readFile(join(destination, 'package.json'), 'utf8'))
      assert.deepEqual(Object.keys(manifest.dependencies).filter(name => name.startsWith('@destyler-ui/')), [`@destyler-ui/${framework}`])
      assert.equal(manifest.dependencies['@destyler/ready-prototype'], `file:${archive}`)
      assert.equal((await readdir(destination)).includes('node_modules'), false, 'Generation performs no install')
      const entry = await readFile(join(destination, framework === 'vue' ? 'App.vue' : framework === 'svelte' ? 'App.svelte' : 'main.tsx'), 'utf8')
      assert.ok(entry.includes(`@destyler/ready-prototype/${framework}`))
      assert.ok(entry.includes('Checkbox') && entry.includes('Select') && entry.includes('Dialog'))
      await writeFile(join(destination, 'sentinel.txt'), 'keep')
      assert.notEqual(generate(framework, destination).status, 0)
      assert.equal(await readFile(join(destination, 'sentinel.txt'), 'utf8'), 'keep')
    }
  } finally { await rm(folder, { recursive: true, force: true }) }
})
