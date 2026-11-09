// Actual /components/ iframe acceptance, not the legacy /css-only proof.
// Prepared but NOT run in the restricted executor. See docs/gallery-browser-acceptance.md.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { families, frameworks, themes, viewports, styleKeys, targetUrl, styleDifferences, resultStatus, requiredStates, disabledCoverage, missingStates } from './lib/gallery-browser-contract.mjs'

if (process.env.RUN_BROWSER_ACCEPTANCE !== '1') throw new Error('Not started. Run only in an authorized browser-capable environment with RUN_BROWSER_ACCEPTANCE=1 and BASE_URL.')
if (!process.env.BASE_URL) throw new Error('BASE_URL is required; never silently inspect an unrelated localhost server')
const base = new URL(targetUrl(process.env.BASE_URL, families[0])).origin
const out = process.env.ARTIFACT_DIR || 'artifacts/all-components/browser'
const report = { status: 'running', pass: false, target: base, operatorProvidedCommit: process.env.EXPECTED_COMMIT || null, startedAt: new Date().toISOString(), cases: [], errors: [], limitations: ['This covers Checkbox, Tabs and Calendar, not all 46 families.', 'Computed properties and screenshots support visual review; they are not a pixel-diff approval or screen-reader acceptance.', 'Keyboard cases use the real browser; manual assistive-technology review remains required.', 'Disabled styles/behavior cover only the real disabled Tabs fixture; Checkbox and Calendar disabled states are explicitly not covered.'] }
await mkdir(out, { recursive: true })
const save = () => writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
await save()
let browser
const pause = page => page.waitForTimeout(250) // Allow the reference's specified state transition to settle.
// Await asynchronous framework commits rather than assuming key events render synchronously.
async function eventually(assertion) {
  const deadline = Date.now() + 3000
  let lastError
  do {
    try { await assertion(); return } catch (error) { lastError = error }
    await new Promise(resolve => setTimeout(resolve, 50))
  } while (Date.now() < deadline)
  throw lastError
}
const snapshot = locator => locator.evaluate((element, keys) => {
  const style = getComputedStyle(element)
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
  const context = canvas.getContext('2d')
  return Object.fromEntries(keys.map(key => {
    let value = style[key]
    if (/color$/i.test(key)) {
      context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1)
      value = [...context.getImageData(0, 0, 1, 1).data].join(',')
    }
    return [key, value]
  }))
}, styleKeys)
const one = async locator => { assert.equal(await locator.count(), 1, 'Expected one unambiguous component part'); return locator }
const dayButton = (frame, reference, day) => frame.locator(reference ? 'table button' : '[data-scope="calendar"][data-part="table-cell-trigger"]').filter({ hasText: new RegExp(`^${day}$`) })
const parts = (frame, family, reference) => {
  if (family === 'checkbox') return { control: frame.locator(reference ? '[data-slot="checkbox"]' : '[data-scope="checkbox"][data-part="control"]'), label: frame.locator(reference ? '[data-slot="label"]' : '[data-scope="checkbox"][data-part="label"]') }
  if (family === 'tabs') return { list: frame.getByRole('tablist'), selectedTab: frame.getByRole('tab', { selected: true }), panel: frame.getByRole('tabpanel').filter({ visible: true }) }
  return { surface: frame.locator(reference ? '[data-slot="calendar"]' : '.parity-calendar-content'), day: dayButton(frame, reference, 15), status: frame.getByRole('status') }
}
async function styles(frame, family, reference) {
  const result = {}
  for (const [name, locator] of Object.entries(parts(frame, family, reference))) result[name] = await snapshot(await one(locator))
  return result
}
async function checked(frame, reference) {
  const input = await one(reference ? frame.getByRole('checkbox', { name: 'Checkbox', exact: true }) : frame.locator('input[type="checkbox"]'))
  await input.focus(); await input.press('Space'); await eventually(async () => assert.equal(await input.isChecked(), true))
  return input
}
async function keyboard(frame, family, reference, capture) {
  if (family === 'checkbox') {
    const input = await checked(frame, reference)
    const control = parts(frame, family, reference).control
    await eventually(async () => assert.equal(await input.evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true, 'Checkbox has actual keyboard focus'))
    if (!reference) await eventually(async () => assert.equal(await control.evaluate(el => el.hasAttribute('data-focus-visible')), true, 'Native visual control reflects hidden-input keyboard focus'))
    await capture('checked-keyboard-focus', parts(frame, family, reference))
    await input.evaluate(el => el.blur())
    assert.equal(await input.evaluate(el => el === document.activeElement), false)
    await capture('checked-blurred', parts(frame, family, reference))
    await input.focus(); await input.press('Space'); await eventually(async () => assert.equal(await input.isChecked(), false))
    assert.equal(await input.evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true)
    await capture('unchecked-keyboard-focus', parts(frame, family, reference))
    return ['Space checks and unchecks; real keyboard-focus and blurred states measured']
  }
  if (family === 'tabs') {
    const tab = name => frame.getByRole('tab', { name: `${name} Trigger`, exact: true })
    const select = async (key, name) => {
      await frame.locator(':focus').press(key)
      await eventually(async () => assert.equal(await tab(name).evaluate(el => el === document.activeElement), true, `${key} focuses ${name}`))
      await tab(name).press('Enter')
      await eventually(async () => assert.equal(await tab(name).getAttribute('aria-selected'), 'true'))
      await eventually(async () => assert.equal((await frame.getByRole('tabpanel').filter({ visible: true }).innerText()).trim(), `${name} Content`))
    }
    await tab('React').focus()
    await select('ArrowRight', 'Solid')
    assert.equal(await tab('Solid').evaluate(el => el.matches(':focus-visible')), true, 'Tab selection retains keyboard focus-visible')
    await capture('selected-keyboard-focus', { tab: tab('Solid'), panel: frame.getByRole('tabpanel').filter({ visible: true }) })
    assert.equal(await tab('React').getAttribute('aria-selected'), 'false')
    await capture('unselected', { tab: tab('React') })
    assert.equal(await tab('Svelte').isDisabled(), true)
    assert.equal(await tab('Svelte').getAttribute('aria-selected'), 'false')
    await capture('disabled', { tab: tab('Svelte') })
    await tab('Solid').evaluate(el => el.blur())
    assert.equal(await tab('Solid').evaluate(el => el === document.activeElement), false)
    await capture('selected-blurred', { tab: tab('Solid'), panel: frame.getByRole('tabpanel').filter({ visible: true }) })
    await tab('Solid').focus()
    await select('ArrowRight', 'Vue') // Disabled Svelte must be skipped.
    await select('Home', 'React'); await select('End', 'Vue'); await select('Home', 'React')
    assert.equal(await tab('Svelte').isDisabled(), true)
    return ['ArrowRight advances and skips disabled Svelte', 'Home/End move focus', 'selection and visible panel stay synchronized']
  }
  const selects = frame.locator('select')
  assert.equal(await selects.count(), 2)
  const month = frame.getByLabel('Choose the Month', { exact: true })
  const year = frame.getByLabel('Choose the Year', { exact: true })
  await one(month); await one(year)
  await year.selectOption({ label: '2027' }); await month.selectOption({ label: 'Dec' })
  // Actual date selection checks the updated grid, not only the select's value.
  await one(dayButton(frame, reference, 15)).then(locator => locator.click())
  await eventually(async () => assert.equal((await frame.getByRole('status').innerText()).trim(), 'Selected: 2027-12-15'))
  await year.selectOption({ label: '2026' }); await month.selectOption({ label: 'Nov' })
  await frame.getByRole('button', { name: /next month/i }).click()
  await eventually(async () => assert.equal((await month.locator('option:checked').textContent()).trim(), 'Dec'))
  await frame.getByRole('button', { name: /previous month/i }).click()
  await eventually(async () => assert.equal((await month.locator('option:checked').textContent()).trim(), 'Nov'))
  const day = await one(dayButton(frame, reference, 15))
  await day.focus(); await day.press('ArrowRight')
  await eventually(async () => assert.equal((await frame.locator(':focus').innerText()).trim(), '16'))
  const focusedDay = await one(dayButton(frame, reference, 16))
  assert.equal(await focusedDay.evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true, 'Calendar day has actual keyboard focus')
  const isSelected = () => focusedDay.evaluate((el, reference) => reference ? el.getAttribute('data-selected-single') === 'true' : el.hasAttribute('data-selected'), reference)
  assert.equal(await isSelected(), false)
  await capture('focused-unselected-day', { day: focusedDay })
  await focusedDay.press('Enter')
  await eventually(async () => assert.equal((await frame.getByRole('status').innerText()).trim(), 'Selected: 2026-11-16'))
  await eventually(async () => assert.equal(await isSelected(), true, 'Selected day DOM state agrees with status'))
  await capture('selected-keyboard-focus-day', { day: focusedDay })
  await focusedDay.evaluate(el => el.blur())
  assert.equal(await focusedDay.evaluate(el => el === document.activeElement), false)
  await capture('selected-blurred-day', { day: focusedDay })
  await focusedDay.focus()
  await frame.locator(':focus').press('Escape')
  assert.equal(await frame.locator('table').isVisible(), true, 'Inline Calendar remains visible')
  return ['Month/year options update actual day cells', 'previous/next month work', 'ArrowRight + Enter selects the adjacent date', 'Escape leaves inline calendar visible']
}
async function openFrames(page, family, theme) {
  const response = await page.goto(targetUrl(base, family), { waitUntil: 'domcontentloaded' })
  if (!response?.ok() || new URL(page.url()).origin !== base) throw Object.assign(new Error(`Gallery navigation returned ${response?.status()} or left the requested origin; check authorized access, do not bypass protection`), { accessBlocked: true })
  await page.locator('.gallery-card').first().waitFor({ timeout: 20000 })
  assert.equal(new URL(page.url()).origin, base, 'Redirected away from requested origin, possibly to login')
  await page.locator(`[data-all-theme="${theme}"]`).click()
  const frames = {}
  for (const framework of frameworks) {
    const card = page.locator(`.gallery-card[data-framework="${framework}"]`)
    await card.locator('.gallery-frame-status').waitFor({ state: 'hidden', timeout: 30000 })
    const handle = await card.locator('iframe').elementHandle()
    const frame = await handle.contentFrame(); assert.ok(frame)
    const url = new URL(frame.url())
    assert.equal(url.origin, base); assert.equal(url.pathname, `/all-components/${framework}/`)
    assert.equal(url.searchParams.get('component'), family); assert.equal(url.searchParams.get('theme'), theme)
    const actualTheme = await frame.locator('html').evaluate(el => el.dataset.theme || (el.classList.contains('dark') ? 'dark' : 'light'))
    assert.equal(actualTheme, theme)
    await frame.evaluate(() => document.fonts.ready)
    frames[framework] = { frame, card }
  }
  await pause(page)
  return frames
}
try {
  const { chromium } = await import('playwright')
  // No retry, sandbox-disabling flags, alternate executable discovery or access bypass.
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  for (const viewport of viewports) for (const family of families) for (const theme of themes) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC' })
    const page = await context.newPage()
    const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message))
    const prefix = `${viewport.name}-${family}-${theme}`
    try {
      const frames = await openFrames(page, family, theme)
      const baseline = await styles(frames.shadcn.frame, family, true)
      await page.screenshot({ path: join(out, `${prefix}-gallery.png`), fullPage: true })
      for (const framework of frameworks) {
        const item = { viewport: viewport.name, family, theme, framework, pass: false, styleDifferences: [], stateStyles: {}, stateSemantics: {}, stateScreenshots: {}, disabledCoverage: disabledCoverage[family], keyboard: [], screenshot: `${prefix}-${framework}.png` }
        report.cases.push(item)
        try {
          const { frame, card } = frames[framework]
          await card.locator('iframe').screenshot({ path: join(out, item.screenshot) })
          const capture = async (state, locators) => {
            await pause(page)
            const measured = {}
            const semantics = {}
            for (const [part, locator] of Object.entries(locators)) {
              measured[part] = await snapshot(await one(locator))
              semantics[part] = await locator.evaluate(el => ({ activeElement: el === document.activeElement, focusVisible: el.matches(':focus-visible'), disabled: el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('data-disabled'), ariaSelected: el.getAttribute('aria-selected'), dataSelected: el.hasAttribute('data-selected'), dataSelectedSingle: el.getAttribute('data-selected-single'), dataFocusVisible: el.hasAttribute('data-focus-visible'), dataState: el.getAttribute('data-state') }))
            }
            item.stateStyles[state] = measured
            item.stateSemantics[state] = semantics
            const filename = `${prefix}-${framework}-${state}.png`
            await card.locator('iframe').screenshot({ path: join(out, filename) })
            item.stateScreenshots[state] = filename
            await save()
          }
          await capture('default', parts(frame, family, framework === 'shadcn'))
          item.keyboard = await keyboard(frame, family, framework === 'shadcn', capture)
          assert.deepEqual(missingStates(family, item.stateStyles), [], 'Every planned state needs actual measurements')
          const referenceCase = framework === 'shadcn' ? item : report.cases.find(row => row.viewport === viewport.name && row.family === family && row.theme === theme && row.framework === 'shadcn')
          assert.ok(referenceCase && !referenceCase.error, 'Reference state sequence must have succeeded')
          assert.deepEqual(missingStates(family, referenceCase.stateStyles), [], 'Missing reference states cannot pass')
          for (const state of requiredStates[family]) {
            const expectedParts = state === 'default' ? baseline : referenceCase.stateStyles[state]
            for (const [part, expected] of Object.entries(expectedParts)) {
              assert.ok(item.stateStyles[state][part], `Missing actual ${state}/${part}`)
              item.styleDifferences.push(...styleDifferences(expected, item.stateStyles[state][part]).map(diff => ({ part, state, ...diff })))
            }
          }
          item.pass = item.styleDifferences.length === 0
        } catch (error) { item.error = String(error.stack || error) }
        await save()
      }
      assert.deepEqual(pageErrors, [], 'Page/iframe runtime errors')
    } catch (error) { if (error.accessBlocked) throw error; report.errors.push({ scenario: prefix, error: String(error.stack || error) }) }
    finally { await context.close(); await save() }
  }
} catch (error) { report.fatal = String(error.stack || error) }
finally {
  await browser?.close()
  report.status = resultStatus(report.cases, report.fatal)
  report.pass = report.status === 'passed' && report.errors.length === 0 && report.cases.length === 60
  if (!report.pass && report.status === 'passed') report.status = 'failed'
  report.finishedAt = new Date().toISOString()
  await save()
  console.log(JSON.stringify({ status: report.status, pass: report.pass, cases: report.cases.length, report: join(out, 'verification.json') }))
  if (!report.pass) process.exitCode = 1
}
