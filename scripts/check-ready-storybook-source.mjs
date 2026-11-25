import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { access, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalog } from '../examples/storybook/catalog.ts'
import { getImplementationUrl, getUsageSource } from '../examples/storybook/usage-source.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const artifactDir = join(root, 'artifacts')
const readyPackage = join(root, 'packages', 'ready')
const frameworks = [
  { name: 'React', extension: 'tsx', checker: 'typescript/bin/tsc' },
  { name: 'Vue', extension: 'vue', checker: 'vue-tsc/bin/vue-tsc.js' },
  { name: 'Solid', extension: 'tsx', checker: 'typescript/bin/tsc' },
  { name: 'Svelte', extension: 'svelte', checker: 'svelte-check/bin/svelte-check' },
]
const entries = Object.entries(catalog)
assert.equal(entries.length, 45, 'Expected the complete Ready catalog')
await mkdir(artifactDir, { recursive: true })
const scratch = await mkdtemp(join(artifactDir, 'storybook-source-check-'))

try {
  // Resolve the snippets' real public exports. No global npm link, source
  // rewriting, production artifact, or extra dependency is needed.
  const scope = join(scratch, 'node_modules', '@destyler')
  await mkdir(scope, { recursive: true })
  await symlink(readyPackage, join(scope, 'ready-prototype'), process.platform === 'win32' ? 'junction' : 'dir')

  for (const { name, extension, checker } of frameworks) {
    const framework = name.toLowerCase()
    const dir = join(scratch, framework)
    await mkdir(dir)
    for (const [component, demo] of entries) {
      const source = getUsageSource(component, name, demo)
      assert.ok(source.includes(`from '@destyler/ready-prototype/${framework}'`), `${name} ${component}: incorrect package import`)
      assert.ok(source.includes("import '@destyler/ready-prototype/theme.css'"), `${name} ${component}: missing theme import`)
      assert.doesNotMatch(source, /\bv-bind\s*=|\{\s*\.\.\./, `${name} ${component}: consumer code must use explicit props`)
      const assertAttributes = (componentName, args) => {
        const opening = source.match(new RegExp(`<${componentName}(?=\\s|>)((?:[^>]|=>)*)>`))?.[1]
        assert.ok(opening !== undefined, `${name} ${componentName}: missing component markup`)
        for (const key of Object.keys(args)) {
          const prop = componentName === 'Label' && name === 'React' && key === 'for' ? 'htmlFor' : key
          const attribute = name === 'Vue' ? prop.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()) : prop
          assert.match(opening, new RegExp(`\\s:?${attribute}\\s*=`), `${name} ${componentName}: missing explicit ${attribute} prop`)
        }
      }
      assertAttributes(component, demo.args)
      if (demo.child && typeof demo.child !== 'string') assertAttributes(demo.child.component, demo.child.args)
      if (demo.action) assertAttributes(component, { controller: true })
      const link = getImplementationUrl(component, name)
      const target = new URL(link)
      const path = target.pathname.match(/^\/destyler\/designs\/blob\/[a-f0-9]{40}\/packages\/ready\/([a-z]+\/[A-Za-z0-9]+\.[a-z]+)$/)?.[1]
      assert.equal(target.origin, 'https://github.com')
      assert.ok(path?.startsWith(`${framework}/`), `${name} ${component}: invalid implementation target`)
      await access(join(readyPackage, path))
      await writeFile(join(dir, `${component}.${extension}`), source)
    }

    const config = join(dir, 'tsconfig.json')
    await writeFile(config, JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        skipLibCheck: true,
        types: ['vite/client'],
        lib: ['DOM', 'DOM.Iterable', 'ES2022'],
        ...(name === 'Solid' ? { jsx: 'preserve', jsxImportSource: 'solid-js' } : { jsx: 'react-jsx' }),
      },
      include: [`*.${extension}`],
    }))
    if (name === 'Svelte') await writeFile(join(dir, 'svelte.config.js'), 'export default {}\n')
    const flags = name === 'Svelte' ? ['--workspace', dir, '--tsconfig', config] : ['--noEmit', '-p', config]
    execFileSync(process.execPath, [join(root, 'node_modules', checker), ...flags], { cwd: root, stdio: 'inherit' })
    console.log(`Storybook usage source: ${name} checked ${entries.length}/${entries.length} snippets.`)
  }
} finally {
  await rm(scratch, { recursive: true, force: true })
}
