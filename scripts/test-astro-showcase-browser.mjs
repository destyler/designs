/** End-to-end checks against the built Astro host and its real framework iframes. */
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const output = 'artifacts/astro'
const evidence = { baseURL, browser: 'Chromium', frameworks: [], sourceFiles: [], screenshots: [], errors: [], checks: [] }
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] }).catch(async error => {
  evidence.status = 'blocked'
  evidence.failure = error.message
  await writeFile(`${output}/browser-evidence.json`, JSON.stringify(evidence, null, 2) + '\n')
  console.error(JSON.stringify(evidence, null, 2))
  throw error
})
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, permissions: ['clipboard-read', 'clipboard-write'] })
const page = await context.newPage()
page.on('pageerror', error => evidence.errors.push({ type: 'pageerror', message: error.message }))
page.on('console', message => {
  if (message.type() === 'error' || /hydration|hydrating|did not match/i.test(message.text())) evidence.errors.push({ type: message.type(), message: message.text() })
})
const frameElement = side => page.locator(`[data-demo="${side}"] iframe.framework-frame`)
const frame = side => page.frameLocator(`[data-demo="${side}"] iframe.framework-frame`)
const until = async (read, expected, message) => {
  const deadline = Date.now() + 10000
  let value
  do {
    value = await read()
    if (JSON.stringify(value) === JSON.stringify(expected)) return
    await new Promise(resolve => setTimeout(resolve, 50))
  } while (Date.now() < deadline)
  assert.deepEqual(value, expected, message)
}
const ready = async side => {
  await until(() => frameElement(side).getAttribute('aria-busy'), 'false', `${side} iframe handshake`)
  assert.equal(await page.locator(`[data-demo="${side}"] .preview-loading`).count(), 0, 'No unresolved loading overlay')
}
const state = control => control.evaluate(el => 'checked' in el ? el.checked : el.getAttribute('aria-checked') === 'true')
const focused = control => control.evaluate(el => el.ownerDocument.activeElement === el)
const cleanCanvas = async side => {
  const text = await frame(side).locator('body').innerText()
  assert.doesNotMatch(text, /Notifications|Settings|Marketing|Product updates|preferences|notifications enabled/i, `${side}: no unrelated demo layout`)
  assert.equal(await frame(side).locator('.showcase-card,.showcase-status,.showcase-stack').count(), 0)
}
const switchTest = async side => {
  const root = frame(side)
  const control = root.getByRole('switch', { name: 'Airplane mode', exact: true })
  await control.waitFor({ state: 'attached' })
  assert.equal(await root.getByRole('switch').count(), 1, `${side}: only one switch`)
  assert.equal(await state(control), false, `${side}: initially off`)
  if (side === 'reference') await control.click()
  else await root.locator('[data-scope="switch"][data-part="control"]').click()
  await until(() => state(control), true, `${side}: click toggles on`)
  await control.press('Space')
  await until(() => state(control), false, `${side}: Space toggles off`)
  await cleanCanvas(side)
}
const dialogTest = async side => {
  const root = frame(side)
  const trigger = root.getByRole('button', { name: 'Open dialog', exact: true })
  await trigger.waitFor()
  assert.equal(await root.getByRole('switch').count(), 0)
  await cleanCanvas(side)
  for (const close of ['Escape', 'Close', 'outside']) {
    await trigger.click()
    const dialog = root.getByRole('dialog', { name: 'Dialog title', exact: true })
    await dialog.waitFor({ state: 'visible' })
    assert.equal(await root.getByRole('dialog').count(), 1)
    assert.ok((await dialog.innerText()).includes('This is a dialog description.'))
    assert.equal(await page.getByRole('dialog').count(), 0, 'Dialog is contained in iframe')
    if (close === 'Escape') await dialog.press('Escape')
    else if (close === 'Close') await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    else {
      const box = await frameElement(side).boundingBox()
      assert.ok(box)
      await page.mouse.click(box.x + 8, box.y + 8)
    }
    await dialog.waitFor({ state: 'hidden' })
    await until(() => focused(trigger), true, `${side}: ${close} restores focus`)
  }
}
const navigate = async component => {
  await page.getByRole('navigation', { name: 'Examples', exact: true }).getByRole('link', { name: component === 'switch' ? 'Switch' : 'Dialog', exact: true }).click()
  await until(() => page.locator('.comparison-grid').getAttribute('data-example'), component, 'Component navigation')
}
const selectFramework = async name => {
  await page.getByLabel('Destyler framework', { exact: true }).selectOption(name)
  await until(() => page.locator('[data-demo="destyler"]').getAttribute('data-framework'), name, 'Framework selection')
  await ready('destyler')
  assert.equal(await page.locator('iframe.framework-frame').count(), 2)
  assert.match(await frameElement('destyler').getAttribute('src'), new RegExp(`/vanilla-extract/${name}/`))
}
const theme = async (side, value) => until(() => frame(side).locator('main').getAttribute('data-theme'), value, `${side}: theme`)
const screenshot = async name => {
  const path = `${output}/${name}.png`
  await page.screenshot({ path, fullPage: true })
  evidence.screenshots.push(path)
}
try {
  await page.goto(`${baseURL}/#switch`)
  await ready('reference'); await ready('destyler')
  const referenceNode = await frameElement('reference').elementHandle()
  const referenceRuntime = `persistent-${Date.now()}`
  await frame('reference').locator('body').evaluate((el, value) => { el.ownerDocument.defaultView.__previewTest = value }, referenceRuntime)
  await switchTest('reference')
  await frame('reference').getByRole('switch', { name: 'Airplane mode' }).click()
  await page.getByLabel('Toggle shadcn/ui color mode', { exact: true }).click()
  await theme('reference', 'dark'); await theme('destyler', 'light')
  const preservedReference = async () => {
    assert.equal(await referenceNode.evaluate(el => el.isConnected), true, 'Reference iframe node preserved')
    assert.equal(await frame('reference').locator('body').evaluate(el => el.ownerDocument.defaultView.__previewTest), referenceRuntime, 'Reference runtime preserved')
    assert.equal(await state(frame('reference').getByRole('switch', { name: 'Airplane mode' })), true, 'Reference switch state preserved')
    await theme('reference', 'dark')
  }
  const extension = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
  for (const name of ['react', 'vue', 'solid', 'svelte', 'react', 'vue']) {
    await selectFramework(name)
    await switchTest('destyler')
    await preservedReference()
    const destylerNode = await frameElement('destyler').elementHandle()
    await page.locator('#code-tab').click()
    assert.equal(await page.locator('#preview-panel').isVisible(), false)
    assert.equal(await page.locator('#code-panel').isVisible(), true)
    assert.equal(await page.locator('[aria-label="Source files"] [role="tab"]').count(), 6)
    const files = {
      component: `examples/vanilla-extract/${name}/Showcase.${extension[name]}`,
      styles: 'packages/vanilla-extract/src/styles.css.ts',
      css: 'packages/vanilla-extract/dist/styles.css',
      exports: 'packages/vanilla-extract/dist/index.js',
      shared: 'examples/vanilla-extract/shared/showcase.ts',
      layout: 'examples/vanilla-extract/shared/showcase.css',
    }
    for (const [id, path] of Object.entries(files)) {
      await page.locator(`#source-tab-${id}`).click()
      const expected = await readFile(path, 'utf8')
      await until(() => page.locator('[data-testid="css-source"]').textContent(), expected, `${name}/${id}: exact source bytes`)
      await page.getByLabel('Copy source', { exact: true }).click()
      await until(() => page.evaluate(() => navigator.clipboard.readText()), expected, `${name}/${id}: clipboard`)
      evidence.sourceFiles.push({ framework: name, tab: id, path, bytes: Buffer.byteLength(expected) })
    }
    for (const [from, key, to] of [['layout', 'ArrowRight', 'component'], ['component', 'ArrowLeft', 'layout'], ['layout', 'Home', 'component'], ['component', 'End', 'layout']]) {
      await page.locator(`#source-tab-${from}`).press(key)
      assert.equal(await page.locator(`#source-tab-${to}`).getAttribute('aria-selected'), 'true')
      assert.equal(await focused(page.locator(`#source-tab-${to}`)), true)
    }
    await preservedReference()
    await page.locator('#code-tab').press('ArrowLeft')
    assert.equal(await focused(page.locator('#preview-tab')), true)
    assert.equal(await destylerNode.evaluate(el => el.isConnected), true, 'Code view retains iframe node')
    await page.locator('#preview-tab').press('End')
    assert.equal(await focused(page.locator('#code-tab')), true)
    await page.locator('#code-tab').press('Home')
    await page.getByLabel('Toggle Destyler color mode', { exact: true }).click()
    await theme('destyler', 'dark'); await theme('reference', 'dark')
    await page.getByLabel('Toggle Destyler color mode', { exact: true }).click()
    await theme('destyler', 'light')
    evidence.frameworks.push(name)
  }
  evidence.checks.push('All framework switches: click and Space; exact source, clipboard and keyboard tabs; stable reference runtime/state/theme')
  await screenshot('desktop-switch')
  await navigate('dialog')
  await dialogTest('reference')
  for (const name of ['react', 'vue', 'solid', 'svelte', 'react']) {
    await selectFramework(name)
    await dialogTest('destyler')
  }
  evidence.checks.push('Reference and all frameworks: dialog open/reopen, Escape, Close, outside click and focus restoration')
  await page.getByLabel('All dark', { exact: true }).click()
  await theme('reference', 'dark'); await theme('destyler', 'dark')
  await frame('destyler').getByRole('button', { name: 'Open dialog' }).click()
  await screenshot('desktop-dialog-dark')
  await frame('destyler').getByRole('dialog').press('Escape')
  await navigate('switch')
  await page.goBack()
  await until(() => page.locator('.comparison-grid').getAttribute('data-example'), 'dialog', 'Back restores dialog route')
  await page.goForward()
  await until(() => page.locator('.comparison-grid').getAttribute('data-example'), 'switch', 'Forward restores switch route')
  await page.getByLabel('All light', { exact: true }).click()
  await theme('reference', 'light'); await theme('destyler', 'light')
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    for (const component of ['switch', 'dialog']) {
      await navigate(component)
      for (const side of ['reference', 'destyler']) {
        assert.equal(await frame(side).locator('body').evaluate(el => el.ownerDocument.documentElement.scrollWidth <= el.ownerDocument.defaultView.innerWidth), true, `${width}/${side}: no canvas overflow`)
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${component}: no host overflow`)
      await screenshot(`mobile-${width}-${component}`)
    }
    await page.locator('#code-tab').click()
    for (const id of ['component', 'styles', 'css', 'exports', 'shared', 'layout']) {
      await page.locator(`#source-tab-${id}`).click()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${id}: code does not overflow host`)
    }
    await screenshot(`mobile-${width}-code`)
    await page.locator('#preview-tab').click()
  }
  evidence.checks.push('Independent light/dark modes, real Back/Forward, desktop plus 390px/320px preview/code overflow and screenshots')
  assert.deepEqual(evidence.errors, [], 'No console, runtime or hydration errors')
  evidence.status = 'passed'
} catch (error) {
  evidence.status = 'failed'
  evidence.failure = error.stack || String(error)
  await screenshot('failure').catch(() => {})
  process.exitCode = 1
} finally {
  await writeFile(`${output}/browser-evidence.json`, JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify(evidence, null, 2))
  await browser.close()
}
