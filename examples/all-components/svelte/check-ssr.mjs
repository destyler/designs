import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { render } from 'svelte/server'
import { examples } from './.ssr/registry.js'
const { families } = JSON.parse(await readFile(new URL('../shared/catalog.json', import.meta.url), 'utf8'))
assert.deepEqual(Object.keys(examples).sort(), [...families].sort())
for (const family of families) {
  const { body } = render(examples[family])
  assert.ok(body.length > 0, `${family}: empty SSR output`)
  console.log(`${family}: SSR passed`)
}
console.log(`${families.length}/${families.length} Svelte examples rendered without required props`)
