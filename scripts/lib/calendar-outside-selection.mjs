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
  await verifyOptionalSelectionAndBounds(document, settle)
}

export async function verifyOptionalSelectionAndBounds(document, settle) {
  const win = document.defaultView
  const triggers = () => [...document.querySelectorAll('[data-scope="calendar"][data-part="table-cell-trigger"]')]
  const status = () => document.querySelector('p[role="status"]').textContent.trim()
  const selected = () => triggers().find(node => node.hasAttribute('data-selected'))
  const first = selected()
  assert.ok(first, 'Precondition: preceding outside-date test left a selected day')
  const value = first.getAttribute('data-value')
  first.click(); await settle()
  assert.equal(status(), 'Select a date', 'Repeated pointer selection clears the optional single value')
  assert.equal(selected(), undefined)
  const day = () => triggers().find(node => node.getAttribute('data-value') === value)
  day().click(); await settle()
  assert.ok(selected(), 'Same day can be selected again after clearing')
  day().focus()
  day().dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); await settle()
  assert.equal(status(), 'Select a date', 'Enter on selected date clears')
  assert.equal(document.activeElement, day(), 'Clearing preserves day focus')
  day().dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true })); await settle()
  assert.equal(status(), 'Select a date', 'Held Enter must not reselect the cleared date')
  day().click(); await settle()
  day().dispatchEvent(new win.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })); await settle()
  assert.equal(status(), 'Select a date', 'Space on selected date clears')
  const selects = [...document.querySelectorAll('select')]
  const month = selects.find(node => /month/i.test(node.getAttribute('aria-label')))
  const year = selects.find(node => /year/i.test(node.getAttribute('aria-label')))
  const choose = async (node, value) => { node.value = String(value); node.dispatchEvent(new win.Event('input', { bubbles: true })); node.dispatchEvent(new win.Event('change', { bubbles: true })); await settle() }
  for (const [y, m] of [[2020, 1], [2030, 12]]) {
    await choose(year, y); await choose(month, m)
    assert.equal(triggers().filter(node => /^(2019|2031)-/.test(node.getAttribute('data-value'))).length, 0, 'No out-of-bound interactive dates')
    const blanks = document.querySelectorAll('td[data-hidden="true"]')
    assert.equal(blanks.length, y === 2020 ? 3 : 0, 'Preserve leading weekday alignment only')
    for (const blank of blanks) assert.equal(blank.querySelector('[tabindex],button,[role="button"]'), null)
    const edge = triggers().find(node => node.getAttribute('data-value') === (y === 2020 ? '2020-01-01' : '2030-12-31'))
    assert.ok(edge && edge.getAttribute('aria-disabled') !== 'true', 'Boundary date remains selectable')
    edge.click(); await settle()
    assert.equal(status(), y === 2020 ? 'Selected: 2020-1-1' : 'Selected: 2030-12-31')
  }
}
