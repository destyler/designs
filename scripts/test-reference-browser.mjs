/** Computed-style regression for the pinned reference, not current shadcn.com pixel parity.
 * Run against a built preview or an explicitly authorized deployment via BASE_URL.
 */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const output = 'artifacts/reference'
const evidence = { baseURL, checks: [], styles: [], errors: [] }
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
const page = await context.newPage()
page.on('pageerror', error => evidence.errors.push(error.message))
const until = async (read, expected, label) => {
  const deadline = Date.now() + 10000
  let actual
  do {
    actual = await read()
    if (JSON.stringify(actual) === JSON.stringify(expected)) return
    await new Promise(resolve => setTimeout(resolve, 50))
  } while (Date.now() < deadline)
  assert.deepEqual(actual, expected, label)
}
const checkTheme = async (root, theme) => {
  await until(() => root.locator('html').getAttribute('data-theme'), theme, 'Document theme')
  await until(() => root.locator('main').getAttribute('data-theme'), theme, 'Hydrated canvas theme')
  assert.equal(await root.locator('html').evaluate(el => el.classList.contains('dark')), theme === 'dark')
}
const checkIsolation = async root => {
  const css = await root.locator('html').evaluate(() => {
    const selectors = [], hrefs = [], inaccessible = []
    function collect(rules) {
      for (const rule of rules) {
        if (rule.selectorText) selectors.push(rule.selectorText)
        if (rule.cssRules) collect(rule.cssRules)
        if (rule.styleSheet) collect(rule.styleSheet.cssRules)
      }
    }
    for (const sheet of document.styleSheets) {
      if (sheet.href) hrefs.push(sheet.href)
      try { collect(sheet.cssRules) } catch (error) { inaccessible.push(String(error)) }
    }
    return { selectors, hrefs, inaccessible }
  })
  assert.deepEqual(css.inaccessible, [], 'All reference CSS must be inspectable')
  assert.ok(css.hrefs.length > 0, 'Built reference loads a linked stylesheet')
  assert.ok(css.selectors.some(selector => selector.includes('.reference-stage')), 'Reference canvas stylesheet present')
  assert.doesNotMatch(css.selectors.join('\n'), /\.unified-showcase|\.site-shell|\.site-header|\.sidebar|\.comparison-grid|\[data-scope|\[data-part|--destyler/, 'No shell or Destyler selectors in reference CSS')
  evidence.checks.push({ isolation: css.hrefs, selectorCount: css.selectors.length })
}
const inspectDialog = async (root, label) => {
  const dialog = root.getByRole('dialog', { name: 'Dialog title', exact: true })
  await dialog.waitFor({ state: 'visible' })
  const actual = await dialog.evaluate(el => {
    const style = getComputedStyle(el)
    const probe = document.createElement('i')
    probe.style.cssText = 'position:absolute;visibility:hidden;border-color:var(--border);background-color:var(--background);color:var(--foreground)'
    el.append(probe)
    const expected = getComputedStyle(probe)
    const result = {
      border: style.borderTopColor, expectedBorder: expected.borderTopColor,
      background: style.backgroundColor, expectedBackground: expected.backgroundColor,
      foreground: style.color, expectedForeground: expected.color,
      widths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      radii: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius],
      padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
    }
    probe.remove()
    return result
  })
  assert.equal(actual.border, actual.expectedBorder, `${label}: border resolves --border on portal root`)
  assert.notEqual(actual.border, actual.foreground, `${label}: border is not currentColor`)
  assert.equal(actual.background, actual.expectedBackground, `${label}: background`)
  assert.equal(actual.foreground, actual.expectedForeground, `${label}: foreground`)
  assert.deepEqual(actual.widths, ['1px', '1px', '1px', '1px'])
  assert.deepEqual(actual.radii, ['10px', '10px', '10px', '10px'])
  assert.deepEqual(actual.padding, ['24px', '24px', '24px', '24px'])
  const icon = dialog.locator(':scope > [data-slot="dialog-close"]')
  assert.equal(await icon.count(), 1, 'Exactly one upstream top-right close')
  assert.equal(await icon.isVisible(), true)
  assert.equal(await icon.innerText(), 'Close')
  const closeStyle = await icon.evaluate(el => {
    const style = getComputedStyle(el), svg = getComputedStyle(el.querySelector('svg'))
    return [style.position, style.top, style.right, svg.width, svg.height]
  })
  assert.deepEqual(closeStyle, ['absolute', '16px', '16px', '16px', '16px'])
  evidence.styles.push({ label, ...actual })
  return dialog
}
const exerciseDialog = async (root, label) => {
  const trigger = root.getByRole('button', { name: 'Open dialog', exact: true })
  for (const method of ['icon', 'footer', 'Escape', 'outside']) {
    await trigger.click()
    const dialog = await inspectDialog(root, `${label}/${method}`)
    if (method === 'icon') await dialog.locator(':scope > [data-slot="dialog-close"]').click()
    else if (method === 'footer') await dialog.locator('[data-slot="dialog-footer"]').getByRole('button', { name: 'Close', exact: true }).click()
    else if (method === 'Escape') await dialog.press('Escape')
    else await root.locator('[data-slot="dialog-overlay"]').click({ position: { x: 4, y: 4 } })
    await dialog.waitFor({ state: 'hidden' })
    await until(() => trigger.evaluate(el => el.ownerDocument.activeElement === el), true, `${label}/${method}: focus restored`)
  }
}
const exerciseSwitch = async root => {
  const control = root.getByRole('switch', { name: 'Airplane mode', exact: true })
  await control.waitFor()
  await until(() => control.getAttribute('aria-checked'), 'false', 'Switch initially unchecked')
  await control.click()
  await until(() => control.getAttribute('aria-checked'), 'true', 'Click checks switch')
  await control.press('Space')
  await until(() => control.getAttribute('aria-checked'), 'false', 'Space unchecks switch')
}
try {
  for (const theme of ['light', 'dark']) {
    await page.goto(`${baseURL}/reference/?component=dialog&theme=${theme}`)
    await checkTheme(page, theme)
    await checkIsolation(page)
    await exerciseDialog(page, `direct/${theme}`)
    await page.goto(`${baseURL}/reference/?component=switch&theme=${theme}`)
    await checkTheme(page, theme)
    await exerciseSwitch(page)
  }
  await page.goto(baseURL)
  const root = page.frameLocator('[data-demo="reference"] iframe.framework-frame')
  await until(() => page.locator('[data-demo="reference"] iframe').getAttribute('aria-busy'), 'false', 'Reference handshake')
  assert.equal(await page.locator('iframe.framework-frame').count(), 5, 'All consumers remain present')
  await page.getByRole('navigation', { name: 'Examples', exact: true }).getByRole('link', { name: 'Switch', exact: true }).click()
  await exerciseSwitch(root)
  await page.getByRole('navigation', { name: 'Examples', exact: true }).getByRole('link', { name: 'Dialog', exact: true }).click()
  await checkIsolation(root)
  for (const theme of ['light', 'dark']) {
    await page.getByLabel(`All ${theme}`, { exact: true }).click()
    await checkTheme(root, theme)
    await exerciseDialog(root, `embedded/${theme}`)
  }
  await root.getByRole('button', { name: 'Open dialog', exact: true }).click()
  const openDialog = root.getByRole('dialog', { name: 'Dialog title', exact: true })
  await openDialog.waitFor({ state: 'visible' })
  const original = await openDialog.elementHandle()
  for (const theme of ['light', 'dark']) {
    await page.getByLabel('Toggle shadcn/ui color mode', { exact: true }).click()
    await checkTheme(root, theme)
    assert.equal(await original.evaluate(el => el.isConnected), true, 'Theme changes preserve open portal node')
    await inspectDialog(root, `embedded/open-theme-change/${theme}`)
  }
  await openDialog.press('Escape')
  await openDialog.waitFor({ state: 'hidden' })
  await until(() => root.getByRole('button', { name: 'Open dialog', exact: true }).evaluate(el => el.ownerDocument.activeElement === el), true, 'Theme-change dismissal restores focus')
  assert.deepEqual(evidence.errors, [], 'No runtime errors')
  evidence.pass = true
  console.log('Pinned reference styling, CSS isolation, theme propagation and interaction checks passed.')
} catch (error) {
  evidence.pass = false
  evidence.failure = error.stack
  throw error
} finally {
  await writeFile(`${output}/browser-evidence.json`, JSON.stringify(evidence, null, 2) + '\n')
  await browser.close()
}
