// Run against served dist or a deployed preview. Never reported as passed by SSR tests.
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createGenerator, presetWind3 } from 'unocss'
const base = (process.env.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '')
let browser
const reportPath = 'artifacts/css-only/browser/verification.json'
await mkdir('artifacts/css-only/browser', { recursive: true })
await writeFile(reportPath, JSON.stringify({ pass: false, status: 'running', startedAt: new Date().toISOString() }, null, 2) + '\n')
const part = (scope, name) => `[data-scope="${scope}"][data-part="${name}"]`
const evidence = []
const snapshot = (locator, keys) => locator.evaluate((el, keys) => {
  const style = getComputedStyle(el)
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
  const context = canvas.getContext('2d')
  return Object.fromEntries(keys.map(key => {
    let value = style[key]
    if (/color$/i.test(key)) {
      context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1)
      value = [...context.getImageData(0, 0, 1, 1).data].join(',')
    }
    if (key === 'borderRadius') value = String(Math.min(parseFloat(value), parseFloat(style.width) / 2, parseFloat(style.height) / 2))
    return [key, value]
  }))
}, keys)
const switchKeys = ['width', 'height', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'opacity']
const dialogKeys = ['width', 'maxWidth', 'padding', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'backgroundColor']
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const packageCSS = await readFile(new URL('../packages/css-only/styles.css', import.meta.url), 'utf8')
  const isolation = await browser.newPage()
  await isolation.setContent('<button id="unrelated">Unrelated native button</button><p>Unrelated paragraph</p>')
  const unrelatedKeys = ['width', 'height', 'backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'borderRadius', 'fontFamily', 'fontSize', 'lineHeight', 'padding', 'margin', 'boxSizing']
  const beforeUnrelated = await snapshot(isolation.locator('#unrelated'), unrelatedKeys)
  const beforeParagraph = await snapshot(isolation.locator('p'), unrelatedKeys)
  await isolation.addStyleTag({ content: packageCSS })
  assert.deepEqual(await snapshot(isolation.locator('#unrelated'), unrelatedKeys), beforeUnrelated, 'Import leaves unrelated native buttons unchanged')
  assert.deepEqual(await snapshot(isolation.locator('p'), unrelatedKeys), beforeParagraph, 'Import leaves unrelated paragraphs unchanged')
  await isolation.close()
  const reference = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await reference.goto(`${base}/css-only/reference/`)
  const baselines = {}
  for (const theme of ['light', 'dark']) {
    await reference.locator('#theme').selectOption(theme)
    baselines[theme] = {}
    for (const name of ['updates', 'small', 'disabled']) {
      const control = reference.locator(`[data-case="${name}"]`)
      await reference.waitForTimeout(220)
      baselines[theme][name] = await snapshot(control, switchKeys)
      baselines[theme][name + 'Thumb'] = await snapshot(control.locator('[data-slot="switch-thumb"]'), ['width', 'height', 'backgroundColor'])
    }
    await reference.getByRole('button', { name: 'Open dialog', exact: true }).click()
    await reference.locator('[data-slot="dialog-content"]').waitFor({ state: 'visible' })
    await reference.waitForTimeout(250)
    baselines[theme].dialog = await snapshot(reference.locator('[data-slot="dialog-content"]'), dialogKeys)
    await reference.keyboard.press('Escape')
  }
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/css-only/${framework}/`)
    const trigger = page.locator(part('dialog', 'trigger'))
    const dialog = page.locator(part('dialog', 'content'))
    const backdrop = page.locator(part('dialog', 'backdrop'))
    assert.equal(await dialog.isVisible(), false)
    assert.equal(await page.locator('[data-scope][class]:not([class=""])').count(), 0)
    for (const theme of ['light', 'dark']) {
      await page.locator('#theme').selectOption(theme)
      for (const name of ['updates', 'small', 'disabled']) {
        const root = page.locator(`[data-case="${name}"]`)
        const control = root.locator(part('switch', 'control'))
        await page.waitForTimeout(220)
        assert.deepEqual(await snapshot(control, switchKeys), baselines[theme][name], `${framework} ${theme} ${name} track matches pinned shadcn`)
        assert.deepEqual(await snapshot(root.locator(part('switch', 'thumb')), ['width', 'height', 'backgroundColor']), baselines[theme][name + 'Thumb'])
      }
      const input = page.locator('[data-case="small"] input')
      await page.locator('[data-case="updates"] input').focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Space')
      await page.waitForTimeout(220)
      assert.equal(await input.isChecked(), true)
      assert.equal(await page.locator('[data-case="small"] ' + part('switch', 'control')).getAttribute('data-focus-visible'), '')
      await page.keyboard.press('Space'); await page.keyboard.press('Tab')
      assert.equal(await page.locator('[data-case="disabled"] input').isDisabled(), true)
      await page.locator('[data-case="readonly"] input').focus(); await page.keyboard.press('Space')
      assert.equal(await page.locator('[data-case="readonly"] input').isChecked(), true)
      const rtl = page.locator('[data-case="rtl"]')
      const rtlThumb = await rtl.locator(part('switch', 'thumb')).boundingBox()
      const rtlControl = await rtl.locator(part('switch', 'control')).boundingBox()
      assert.ok(Math.abs(rtlThumb.x - rtlControl.x - 1) < 1, 'Checked RTL thumb is at the left end')
      for (const close of ['Escape', 'Close', 'outside']) {
        await trigger.click(); await dialog.waitFor({ state: 'visible' }); await page.waitForTimeout(250)
        assert.deepEqual(await snapshot(dialog, dialogKeys), baselines[theme].dialog, `${framework} ${theme} dialog matches pinned surface`)
        assert.equal(await dialog.evaluate(el => !document.querySelector('#app').contains(el)), true, 'Real body portal')
        for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true) }
        if (close === 'Escape') await page.keyboard.press('Escape')
        else if (close === 'Close') await dialog.getByRole('button', { name: 'Close', exact: true }).click()
        else await backdrop.click({ position: { x: 5, y: 5 } })
        await dialog.waitFor({ state: 'hidden' }); await page.waitForTimeout(120)
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true, 'Focus restored')
      }
    }
    await page.locator('#theme').selectOption('light'); await page.locator('#tokens').check(); await page.waitForTimeout(220)
    assert.equal(await page.locator('[data-case="updates"] ' + part('switch', 'control')).evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(124, 58, 237)')
    await trigger.click(); await dialog.waitFor({ state: 'visible' })
    assert.equal(await dialog.evaluate(el => getComputedStyle(el).borderRadius), '16px')
    assert.equal(await dialog.evaluate(el => getComputedStyle(el).getPropertyValue('--dy-primary').trim()), '#7c3aed')
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' }); await page.locator('#tokens').uncheck()
    // Derived tokens must resolve after a descendant override, not at :root.
    await page.locator('[data-case="small"]').evaluate(el => el.style.setProperty('--dy-background', '#ff0000'))
    assert.equal(await page.locator('[data-case="small"] ' + part('switch', 'thumb')).evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 0, 0)')
    await page.locator('[data-case="small"]').evaluate(el => el.style.removeProperty('--dy-background'))
    // A local theme does not follow a detached portal. This intentionally verifies the boundary.
    await page.locator('#app').evaluate(el => { el.dataset.theme = 'dark'; el.style.setProperty('--dy-primary', '#123456') })
    await page.locator('[data-case="small"]').evaluate(el => { el.dataset.theme = 'light' })
    await page.waitForTimeout(220)
    assert.deepEqual(await snapshot(page.locator('[data-case="small"] ' + part('switch', 'control')), switchKeys), baselines.light.small, 'Nested light scope resets inherited dark theme')
    await page.locator('[data-case="small"]').evaluate(el => { delete el.dataset.theme })
    await trigger.click(); await dialog.waitFor({ state: 'visible' })
    assert.notEqual(await trigger.evaluate(el => getComputedStyle(el).getPropertyValue('--dy-primary').trim()), await dialog.evaluate(el => getComputedStyle(el).getPropertyValue('--dy-primary').trim()))
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' })
    await page.locator('#app').evaluate(el => { delete el.dataset.theme; el.style.removeProperty('--dy-primary') })
    // Real UnoCSS output, unlayered, loaded BEFORE package CSS to prove layer precedence.
    const uno = await createGenerator({ presets: [presetWind3()], rules: [['fixture-utility-override', { 'border-radius': '0px', 'padding-left': '32px', 'padding-right': '32px' }]] })
    const utility = (await uno.generate('fixture-utility-override', { preflights: false })).css
    await page.evaluate(css => { const el = document.createElement('style'); el.textContent = css; document.head.prepend(el) }, utility)
    await trigger.evaluate(el => el.classList.add('fixture-utility-override'))
    assert.equal(await trigger.evaluate(el => getComputedStyle(el).borderRadius), '0px')
    assert.equal(await trigger.evaluate(el => getComputedStyle(el).paddingLeft), '32px')
    await trigger.evaluate(el => el.classList.remove('fixture-utility-override'))
    // Removing all fixture styles must leave component geometry intact.
    const before = await snapshot(page.locator('[data-case="updates"] ' + part('switch', 'control')), switchKeys)
    await page.evaluate(css => { for (const el of document.querySelectorAll('link[rel="stylesheet"], style')) el.remove(); const el = document.createElement('style'); el.textContent = css; document.head.append(el) }, packageCSS)
    assert.deepEqual(await snapshot(page.locator('[data-case="updates"] ' + part('switch', 'control')), switchKeys), before)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.locator('[data-case="updates"] ' + part('switch', 'control')).evaluate(el => getComputedStyle(el).transitionDuration), '0s')
    await page.setViewportSize({ width: 390, height: 844 }); await trigger.click(); await dialog.waitFor({ state: 'visible' })
    assert.ok((await dialog.boundingBox()).width <= 358)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true)
    await mkdir('artifacts/css-only/browser', { recursive: true })
    await page.screenshot({ path: `artifacts/css-only/browser/${framework}-mobile.png`, fullPage: true })
    await page.keyboard.press('Escape')
    assert.deepEqual(errors, [])
    evidence.push({ framework, pass: true, comparedTo: 'pinned original shadcn Switch and Dialog surface', checks: ['light/dark', 'states', 'keyboard', 'RTL', 'focus trap/return', 'outside dismissal', 'repeat open/close', 'body portal', 'global tokens', 'local portal boundary', 'descendant overrides', 'UnoCSS', 'no fixture reset', 'reduced motion', 'mobile'] })
    await page.close()
  }
  await mkdir('artifacts/css-only/browser', { recursive: true })
  await writeFile(reportPath, JSON.stringify({ pass: true, evidence }, null, 2) + '\n')
  console.log('CSS-only four-framework browser parity and interaction suite passed.')
} catch (error) {
  await writeFile(reportPath, JSON.stringify({ pass: false, evidence, error: String(error.stack || error) }, null, 2) + '\n')
  throw error
} finally { await browser?.close() }
