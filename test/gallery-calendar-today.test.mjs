import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('reference Calendar compares the real UTC day instead of a frozen today marker', async () => {
  const source = await readFile(new URL('../examples/all-components/shadcn/demos/calendar.tsx', import.meta.url), 'utf8')
  assert.match(source, /const now = new Date\(\)/)
  assert.match(source, /new Date\(now\.getUTCFullYear\(\), now\.getUTCMonth\(\), now\.getUTCDate\(\)\)/)
  assert.match(source, /today=\{today\}/)
  assert.doesNotMatch(source, /today=\{new Date\(2026, 10, 6\)\}/)
  assert.match(source, /defaultMonth=\{new Date\(2026, 10, 1\)\}/, 'Example month remains the shared November fixture')
})
