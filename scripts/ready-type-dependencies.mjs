// Locked mode reuses npm ci's dependency tree, not a clean installation test.
// Keep the Ready scope real so the package under test always comes from npm pack.
import { mkdir, readdir, symlink, stat, realpath } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import assert from 'node:assert/strict'

export function dependencyMode(argument, script) {
  assert.ok(argument, `Usage: node scripts/${script} --locked | /tmp/ready-clean-consumers-EXISTING`)
  assert.ok(argument === '--locked' || !argument.startsWith('--'), `Unknown option: ${argument}`)
  return argument === '--locked' ? { locked: true } : { locked: false, directory: resolve(argument) }
}

export async function linkTypeDependencies(installed, modules) {
  await stat(installed)
  await mkdir(modules, { recursive: true })
  for (const name of await readdir(installed)) {
    if (name === '@destyler') {
      await mkdir(join(modules, name), { recursive: true })
      for (const child of await readdir(join(installed, name))) {
        if (child !== 'ready-prototype') await symlink(join(installed, name, child), join(modules, name, child))
      }
    } else await symlink(join(installed, name), join(modules, name))
  }
}

export async function assertPackedReady(folder, framework, run) {
  const modules = join(folder, 'node_modules/@destyler/ready-prototype')
  assert.equal(await realpath(modules), join(await realpath(folder), 'node_modules/@destyler/ready-prototype'), 'Ready must be extracted, not linked to repository source')
  const { writeFile } = await import('node:fs/promises')
  await writeFile(join(folder, 'packed-resolve.mjs'), `import assert from 'node:assert/strict';for(const name of ['@destyler/ready-prototype/${framework}','@destyler/ready-prototype/types','@destyler/ready-prototype/theme.css']){const location=import.meta.resolve(name);assert.ok(location.startsWith(new URL('./node_modules/@destyler/ready-prototype/',import.meta.url).href),location);console.log(name,location)}`)
  await writeFile(join(folder, 'packed-resolve.log'), run(process.execPath, ['packed-resolve.mjs'], folder))
}
