import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))

test('Ready packed source package exposes intentional entries and optional framework peers', async () => {
  const folder = await mkdtemp(join(root, 'node_modules/.ready-package-'))
  try {
    const [packed] = JSON.parse(execFileSync('npm', ['pack', './packages/ready', '--json', '--ignore-scripts', '--pack-destination', folder, '--cache', '/tmp/ready-pack-cache'], { cwd: root, encoding: 'utf8' }))
    assert.ok(packed.files.every(file => !/(?:^|\/)(?:test|examples|node_modules|artifacts)(?:\/|$)/.test(file.path)))
    assert.ok(packed.files.some(file => file.path === 'THEMING.md'), 'Packed README theme link resolves inside archive')
    const target = join(folder, 'node_modules/@destyler/ready-prototype')
    await mkdir(target, { recursive: true })
    execFileSync('tar', ['-xzf', join(folder, packed.filename), '--strip-components=1', '-C', target])
    // Inspect the actual archive, not only the working-tree README. Local links
    // must stay inside the package; repository links must name tracked docs.
    const repositoryDocs = 'https://github.com/destyler/designs/blob/feat/ready-components-pilot/'
    const files = new Set(packed.files.map(file => file.path))
    const tracked = new Set(execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).trim().split('\n'))
    for (const doc of ['README.md', 'THEMING.md']) {
      const markdown = await readFile(join(target, doc), 'utf8')
      const links = [...markdown.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map(match => match[1])
      assert.ok(links.length, `${doc}: expected documentation links`)
      for (const href of links) {
        if (href.startsWith('#')) continue
        if (href.startsWith(repositoryDocs)) {
          assert.ok(tracked.has(href.slice(repositoryDocs.length).split(/[?#]/)[0]), `${doc}: missing repository document ${href}`)
        } else if (/^[a-z]+:/i.test(href)) {
          assert.equal(new URL(href).protocol, 'https:', `${doc}: external links must use HTTPS`)
        } else {
          const resolved = posix.normalize(posix.join(posix.dirname(doc), href.split(/[?#]/)[0]))
          assert.ok(!resolved.startsWith('../') && !posix.isAbsolute(resolved) && files.has(resolved), `${doc}: link escapes or is absent from tarball: ${href}`)
        }
      }
      if (doc === 'README.md') assert.ok(links.includes(repositoryDocs + 'docs/ready-rtl.md'), 'Packed RTL link resolves to repository documentation')
    }
    const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
    for (const name of ['react', 'vue', 'solid', 'svelte']) assert.ok(manifest.exports[`./${name}`])
    assert.equal(manifest.exports['./theme.css'], './theme.css')
    for (const [peer, metadata] of Object.entries(manifest.peerDependenciesMeta)) assert.equal(metadata.optional, true, peer)
    assert.deepEqual(manifest.sideEffects, ['**/*.css'])
    const { build } = await import('vite')
    for (const framework of ['react', 'vue', 'solid', 'svelte']) {
      const plugins = framework === 'react' ? [(await import('@vitejs/plugin-react')).default()] : framework === 'vue' ? [(await import('@vitejs/plugin-vue')).default()] : framework === 'solid' ? [(await import('vite-plugin-solid')).default()] : [(await import('@sveltejs/vite-plugin-svelte')).svelte()]
      const entry = join(folder, `${framework}.ts`)
      await writeFile(entry, `import {Checkbox, Select, Dialog} from '@destyler/ready-prototype/${framework}';import '@destyler/ready-prototype/theme.css';export {Checkbox, Select, Dialog};`)
      const output = join(folder, `out-${framework}`)
      const modules = []
      plugins.push({ name: 'ready-consumer-graph', generateBundle() { modules.push(...this.getModuleIds()) } })
      await build({ root: folder, configFile: false, logLevel: 'error', plugins, build: { outDir: output, minify: false, lib: { entry, formats: ['es'], fileName: () => 'consumer.js', cssFileName: 'consumer' } } })
      const js = await readFile(join(output, 'consumer.js'), 'utf8')
      const css = await readFile(join(output, 'consumer.css'), 'utf8')
      assert.match(css, /--rd-accent/)
      assert.match(css, /max-height:\s*min\(20rem,\s*var\(--available-height,\s*20rem\)\)/, 'Packed CSS retains the long-list height cap')
      assert.match(css, /overflow-y:\s*auto/, 'Packed CSS retains vertical overflow')
      assert.match(js, /Checkbox/)
      assert.ok(modules.some(id => id.includes(target)), 'Uses unpacked package, not repository source aliases')
      for (const other of ['react', 'vue', 'solid', 'svelte'].filter(name => name !== framework)) assert.ok(!modules.some(id => id.includes(`/@destyler-ui/${other}/`)), `Does not bundle unused ${other} UI adapter`)
      assert.ok(!js.includes('React.createElement'), `${framework}: JSX must use its own framework transform`)
    }
  } finally { await rm(folder, { recursive: true, force: true }) }
})
