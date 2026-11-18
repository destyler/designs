// npm packaging/reinstall contract only; this is not a framework build or browser test.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, copyFile, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = fileURLToPath(new URL('../', import.meta.url))
const filename = 'destyler-ready-prototype-0.0.0.tgz'
function npm(args, cwd, cache) {
  return spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', [...args, '--ignore-scripts', '--offline', '--no-audit', '--no-fund', '--cache', cache], { cwd, encoding: 'utf8', timeout: 60000 })
}
function ok(result) { assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`) }

test('Ready archive must travel with the app for a fresh-cache npm ci', { timeout: 90000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), 'ready-reinstall-test-'))
  try {
    const archiveDir = join(temp, 'ephemeral'), original = join(temp, 'original'), broken = join(temp, 'fresh-broken'), stable = join(temp, 'stable'), moved = join(temp, 'other-checkout')
    for (const dir of [archiveDir, original, broken, stable, moved]) await mkdir(dir)
    ok(npm(['pack', './packages/ready', '--pack-destination', archiveDir], repo, join(temp, 'pack-cache')))
    const archive = join(archiveDir, filename)
    await writeFile(join(original, 'package.json'), JSON.stringify({ name: 'archive-reinstall-fixture', version: '1.0.0', private: true }))
    ok(npm(['install', archive], original, join(temp, 'install-cache')))
    for (const name of ['package.json', 'package-lock.json']) await copyFile(join(original, name), join(broken, name))
    // Rename only our fixture, not a user archive. A fresh cache cannot hide its absence.
    await rename(archive, `${archive}.held`)
    const missing = npm(['ci'], broken, join(temp, 'missing-cache'))
    assert.notEqual(missing.status, 0)
    assert.match(missing.stderr, /ENOENT/)
    assert.ok(missing.stderr.includes(filename))

    const relative = `vendor/destyler/test-revision/${filename}`
    await mkdir(join(stable, 'vendor/destyler/test-revision'), { recursive: true })
    await copyFile(`${archive}.held`, join(stable, relative))
    await writeFile(join(stable, 'package.json'), JSON.stringify({ name: 'archive-reinstall-fixture', version: '1.0.0', private: true }))
    ok(npm(['install', `./${relative}`], stable, join(temp, 'stable-install-cache')))
    const manifest = JSON.parse(await readFile(join(stable, 'package.json'), 'utf8'))
    const lock = JSON.parse(await readFile(join(stable, 'package-lock.json'), 'utf8'))
    assert.equal(manifest.dependencies['@destyler/ready-prototype'], `file:${relative}`)
    const locked = lock.packages['node_modules/@destyler/ready-prototype']
    assert.equal(locked.resolved, `file:${relative}`)
    assert.match(locked.integrity, /^sha512-/)
    for (const name of ['package.json', 'package-lock.json']) await copyFile(join(stable, name), join(moved, name))
    await mkdir(join(moved, 'vendor/destyler/test-revision'), { recursive: true })
    await copyFile(join(stable, relative), join(moved, relative))
    // Remove the original fixture's location from the equation, while retaining its data.
    await rename(stable, `${stable}.held`)
    ok(npm(['ci'], moved, join(temp, 'fresh-success-cache')))
    const installed = JSON.parse(await readFile(join(moved, 'node_modules/@destyler/ready-prototype/package.json'), 'utf8'))
    assert.equal(installed.name, '@destyler/ready-prototype')
    assert.equal(await readFile(join(moved, 'package-lock.json'), 'utf8'), await readFile(join(`${stable}.held`, 'package-lock.json'), 'utf8'))
  } finally { await rm(temp, { recursive: true, force: true }) }
})
