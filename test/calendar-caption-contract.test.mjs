import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const paths = [
  'react/components/calendar/Basic.tsx',
  'vue/calendar/Basic.vue',
  'solid/components/calendar/Basic.tsx',
  'svelte/calendar.svelte',
]
for (const path of paths) {
  test(`${path}: calendar preserves native selects under visible SVG captions`, async () => {
    const source = await readFile(new URL(`../examples/all-components/${path}`, import.meta.url), 'utf8')
    assert.equal((source.match(/(?:class|className)="parity-calendar-dropdown"/g) ?? []).length, 2)
    assert.equal((source.match(/(?:class|className)="parity-calendar-caption-label"\s+aria-hidden="true"/g) ?? []).length, 2)
    assert.equal((source.match(/<select\b|<Calendar\.(?:Month|Year)Select\b/g) ?? []).length, 2)
    assert.match(source, /visibleRange\.start\.month/)
    assert.match(source, /visibleRange\.start\.year/)
    assert.match(source, /<path d="m15 18-6-6 6-6"/)
    assert.match(source, /<path d="m9 18 6-6-6-6"/)
    assert.equal((source.match(/<path d="m6 9 6 6 6-6"/g) ?? []).length, 2)
    assert.doesNotMatch(source, /[‹›]/)
  })
}
