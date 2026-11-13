import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const out = join(root, 'artifacts/all-components')
await mkdir(out, { recursive: true })
const commands = [
  'examples/all-components/shadcn/verify.mjs',
  'examples/all-components/react/verify.mjs',
  'examples/all-components/vue/verify-ssr-hydration.mjs',
  'examples/all-components/solid/check-hydration.mjs',
  'examples/all-components/svelte/verify-hydration.mjs',
  'scripts/audit-all-component-semantics.mjs',
  'scripts/verify-all-component-styles.mjs',
  'scripts/verify-all-component-assets.mjs',
  'scripts/test-all-components-host.mjs',
]
const report = { browser: false, pass: true, commands: [] }
for (const script of commands) {
  const start = Date.now()
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', timeout: 600_000, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } })
  const log = `${script.replaceAll('/', '-')}.log`
  await writeFile(join(out, log), (result.stdout || '') + (result.stderr || ''))
  const row = { script, exit: result.status, seconds: (Date.now() - start) / 1000, log, error: result.error?.message }
  report.commands.push(row)
  if (result.status !== 0) report.pass = false
  console.log(JSON.stringify(row))
  await writeFile(join(out, 'aggregate.json'), JSON.stringify(report, null, 2) + '\n')
}
if (!report.pass) process.exitCode = 1
