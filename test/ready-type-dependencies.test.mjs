import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, lstat, realpath, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { dependencyMode, linkTypeDependencies } from '../scripts/ready-type-dependencies.mjs'

test('locked dependency links reserve an independent Ready extraction directory', async () => {
  const temp = await realpath(await mkdtemp(join(tmpdir(), 'ready-type-links-')))
  try {
    const source = join(temp, 'source'), target = join(temp, 'consumer/node_modules')
    for (const name of ['react', '@destyler/ready-prototype', '@destyler/utils', '@types/react']) {
      await mkdir(join(source, name), { recursive: true })
      await writeFile(join(source, name, 'sentinel'), name)
    }
    await linkTypeDependencies(source, target)
    assert.equal((await lstat(join(target, '@destyler'))).isSymbolicLink(), false)
    await assert.rejects(lstat(join(target, '@destyler/ready-prototype')), { code: 'ENOENT' })
    for (const name of ['react', '@destyler/utils', '@types']) {
      assert.equal((await lstat(join(target, name))).isSymbolicLink(), true)
      assert.equal(await realpath(join(target, name)), join(source, name))
    }
    const ready = join(target, '@destyler/ready-prototype')
    await mkdir(ready)
    await writeFile(join(ready, 'sentinel'), 'packed replacement')
    await rm(ready, { recursive: true })
    assert.equal(await readFile(join(source, '@destyler/ready-prototype/sentinel'), 'utf8'), '@destyler/ready-prototype')
    assert.equal(await readFile(join(source, '@destyler/utils/sentinel'), 'utf8'), '@destyler/utils')
  } finally { await rm(temp, { recursive: true, force: true }) }
})

test('type dependency modes reject unknown flags and keep explicit prior paths', () => {
  assert.deepEqual(dependencyMode('--locked', 'audit.mjs'), { locked: true })
  assert.deepEqual(dependencyMode('/tmp/prior-consumer', 'audit.mjs'), { locked: false, directory: '/tmp/prior-consumer' })
  assert.throws(() => dependencyMode('--typo', 'audit.mjs'), /Unknown option/)
  assert.throws(() => dependencyMode(undefined, 'audit.mjs'), /Usage:/)
})
