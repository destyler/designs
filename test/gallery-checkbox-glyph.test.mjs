// Source geometry contracts only; this does not establish rendered visual parity.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CheckIcon } from 'lucide-react'

const reference = renderToStaticMarkup(createElement(CheckIcon, { size: 14 }))
const path = reference.match(/<path d="([^"]+)"/)[1]
for (const [framework, file] of Object.entries({ react: 'components/checkbox/Basic.tsx', vue: 'checkbox/Basic.vue', solid: 'components/checkbox/Basic.tsx', svelte: 'checkbox.svelte' })) {
  test(`${framework} Checkbox uses the pinned reference glyph geometry`, async () => {
    const source = await readFile(new URL(`../examples/all-components/${framework}/${file}`, import.meta.url), 'utf8')
    assert.ok(source.includes(`<path d="${path}"`))
    assert.match(source, /viewBox="0 0 24 24"/)
    assert.match(source, /width="14"/)
    assert.match(source, /height="14"/)
    assert.match(source, /aria-hidden="true"/)
    assert.match(source, /stroke(?:-width|Width)="2"/)
    assert.match(source, /stroke(?:-linecap|Linecap)="round"/)
    assert.match(source, /stroke(?:-linejoin|Linejoin)="round"/)
  })
}
