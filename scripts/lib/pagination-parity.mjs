import assert from 'node:assert/strict'

// Application reference window: endpoints plus two neighbors, without edge padding.
export async function verifyPaginationParity(document, settle) {
  const part = name => document.querySelector(`[data-scope="pagination"][data-part="${name}"]`)
  const verify = page => {
    const expected = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => page - 2 + i).filter(n => n > 1 && n < 10), 10])].sort((a, b) => a - b)
    const items = [...document.querySelectorAll('[data-scope="pagination"][data-part="item"]')]
    assert.deepEqual(items.map(n => Number(n.textContent.trim())), expected, `Reference page window at ${page}`)
    assert.equal(document.querySelectorAll('[data-scope="pagination"][data-part="ellipsis"]').length, expected.filter((n, i) => i && n - expected[i - 1] > 1).length)
    assert.equal(items.filter(n => n.getAttribute('aria-current') === 'page').length, 1)
    assert.match(document.querySelector('[role="status"]').textContent, new RegExp(`Page ${page} of 10`))
  }
  verify(1)
  for (let page = 2; page <= 10; page++) { part('next-trigger').click(); await settle(); verify(page) }
  assert.ok(part('next-trigger').disabled)
  for (let page = 9; page >= 1; page--) { part('prev-trigger').click(); await settle(); verify(page) }
  assert.ok(part('prev-trigger').disabled)
}
