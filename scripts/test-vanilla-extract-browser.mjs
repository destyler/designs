import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
const base = process.env.BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const evidence = []
const properties = ['width', 'height', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'boxShadow', 'opacity']
const snapshot = (locator, keys = properties) => locator.evaluate((el, keys) => Object.fromEntries(keys.map(key => [key, getComputedStyle(el)[key]])), keys)
try {
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    const url = process.env[`${framework.toUpperCase()}_URL`] || `${base}/vanilla-extract/${framework}/`
    await page.goto(url)
    const panels = ['vanilla', 'tailwind'].map(engine => page.locator(`[data-panel="${framework}-${engine}"]`))
    for (const dark of [false, true]) {
      for (const panel of panels) await panel.getByLabel('Dark', { exact: true }).setChecked(dark)
      for (const name of ['updates', 'small', 'disabled']) {
        const controls = panels.map(panel => panel.locator(`[data-case="${name}"] [data-part="control"]`))
        await page.waitForTimeout(220)
        assert.deepEqual(await snapshot(controls[0]), await snapshot(controls[1]), `${framework} ${dark ? 'dark' : 'light'} ${name} default styles`)
        if (name !== 'disabled') {
          const focused = []
          for (const [index, panel] of panels.entries()) {
            await panel.locator(`[data-case="${name}"] [role="switch"]`).press('Space')
            await page.waitForTimeout(220)
            focused.push(await snapshot(controls[index]))
          }
          assert.deepEqual(focused[0], focused[1], `${framework} ${name} keyboard checked + focus styles`)
          for (const panel of panels) await panel.locator(`[data-case="${name}"] [role="switch"]`).press('Space')
        } else for (const panel of panels) assert.equal(await panel.getByRole('switch', { name: 'Disabled', exact: true }).isDisabled(), true)
      }
      const dialogs = []
      for (const [index, panel] of panels.entries()) {
        const id = `${framework}-${index ? 'tailwind' : 'vanilla'}`
        const trigger = panel.locator('[data-action="open-dialog"]')
        for (const closing of ['Escape', 'Done', 'Close dialog']) {
          await trigger.click()
          const dialog = page.locator(`[data-demo-dialog="${id}"]`)
          await dialog.waitFor({ state: 'visible' }); await page.waitForTimeout(250)
          if (closing === 'Escape') dialogs.push(await snapshot(dialog, ['width', 'padding', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'backgroundColor', 'boxShadow']))
          assert.equal(await dialog.evaluate(el => getComputedStyle(el).getPropertyValue('--dy-primary')), await panel.evaluate(el => getComputedStyle(el).getPropertyValue('--dy-primary')))
          await page.keyboard.press('Tab'); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true, 'Focus stays inside dialog')
          if (closing === 'Escape') await page.keyboard.press('Escape'); else await dialog.getByRole('button', { name: closing, exact: true }).click()
          await dialog.waitFor({ state: 'hidden' }); await page.waitForTimeout(100)
          assert.equal(await trigger.evaluate(el => el === document.activeElement), true, 'Focus returns to trigger')
        }
      }
      assert.deepEqual(dialogs[0], dialogs[1], `${framework} dialog base styles match`)
      evidence.push({ framework, dark, switches: 'equal measured styles; keyboard/disabled checked', dialog: dialogs[0] })
    }
    const vanilla = panels[0]
    await vanilla.getByLabel('Token override', { exact: true }).check()
    await page.waitForTimeout(220)
    assert.equal((await snapshot(vanilla.locator('[data-case=updates] [data-part=control]'))).backgroundColor, 'rgb(124, 58, 237)')
    const trigger = vanilla.locator('[data-action=open-dialog]')
    await vanilla.getByLabel('UnoCSS override', { exact: true }).check()
    assert.equal(await trigger.evaluate(el => getComputedStyle(el).borderRadius), '0px')
    assert.equal(await trigger.evaluate(el => getComputedStyle(el).paddingLeft), '32px')
    await trigger.click(); const dialog = page.locator(`[data-demo-dialog="${framework}-vanilla"]`); await dialog.waitFor({state:'visible'})
    assert.equal(await dialog.evaluate(el => getComputedStyle(el).borderRadius), '16px')
    assert.equal(await dialog.evaluate(el => getComputedStyle(el).getPropertyValue('--dy-primary').trim()), '#7c3aed')
    await page.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'})
    await mkdir('artifacts/vanilla-extract', { recursive: true })
    await page.screenshot({ path: `artifacts/vanilla-extract/${framework}-desktop.png`, fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'No phone-width overflow')
    await trigger.click(); await dialog.waitFor({state:'visible'}); await page.waitForTimeout(250)
    assert.ok(parseFloat(await dialog.evaluate(el => getComputedStyle(el).width)) <= 358)
    await page.screenshot({path:`artifacts/vanilla-extract/${framework}-mobile-dialog.png`,fullPage:true})
    await page.keyboard.press('Escape')
    await page.goto(`${url}?isolated=1`)
    assert.equal(await page.locator('[data-panel]').count(), 1)
    assert.equal(await page.locator('[data-engine=tailwind]').count(), 0)
    assert.equal(await page.evaluate(() => [...document.styleSheets].some(sheet => sheet.href?.includes('baseline'))), false, 'No baseline stylesheet in isolated consumer')
    assert.equal(errors.length, 0, errors.join('\n'))
    await page.close()
  }
  await writeFile('artifacts/vanilla-extract/browser.json', JSON.stringify(evidence, null, 2))
  console.log('React/Vue/Solid/Svelte browser state, style, theme, override, focus, responsive and isolation checks passed.')
} finally { await browser.close() }
