import assert from 'node:assert/strict'

// Simulated DOM coverage only. The calling framework owns its update settling.
export async function verifyOutsideSelection(document, settle) {
  const outside = document.querySelector('[data-scope="calendar"][data-part="table-cell-trigger"][data-outside-range]')
  assert.ok(outside, 'Calendar must render an outside-month date')
  assert.ok(!outside.disabled && !outside.hasAttribute('data-disabled') && outside.getAttribute('aria-disabled') !== 'true', 'Outside date must be enabled by the gallery opt-in')
  const value = outside.getAttribute('data-value')
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/)
  outside.click()
  await settle()
  const selected = value.split('-').map(Number).join('-')
  assert.equal(document.querySelector('[role="status"]').textContent.trim(), `Selected: ${selected}`)
  const selectedCell = document.querySelector(`[data-scope="calendar"][data-part="table-cell-trigger"][data-value="${value}"]`)
  assert.ok(selectedCell?.hasAttribute('data-selected'), 'Selected outside date must be reflected in Calendar state')
}
