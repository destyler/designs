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
  if (side !== 'reference') {
    assert.equal(await frame(side).locator('main[data-showcase]').count(), 1)
    assert.equal(await frame(side).locator('[data-scope][class]:not([class=""]), main[data-showcase][class]:not([class=""]), [data-portal-owner][class]:not([class=""])').count(), 0, 'CSS-only anatomy has no design classes')
  }
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
    await cleanCanvas(side)
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
const theme = async (side, value) => {
  await until(() => frame(side).locator('main').getAttribute('data-theme'), value, `${side}: theme`)
  if (side !== 'reference') await until(() => frame(side).locator('html').getAttribute('data-theme'), value, `${side}: document theme for portals`)
}
const screenshot = async name => {
  const path = `${output}/${name}.png`
  await page.screenshot({ path, fullPage: true })
  evidence.screenshots.push(path)
}
const frameworks = { react: 'React', vue: 'Vue', solid: 'Solid', svelte: 'Svelte' }
const sides = ['reference', ...Object.keys(frameworks)]
const extension = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
const card = name => page.locator(`[data-demo="${name}"]`)
const view = async (name, code) => {
  assert.equal(await page.locator(`#${name}-preview-panel`).isVisible(), !code)
  assert.equal(await page.locator(`#${name}-code-panel`).isVisible(), code)
}
const inspectFiles = async (name, example) => {
  const files = {
    component: `examples/css-only/${name}/${example === 'switch' ? 'Switch' : 'Dialog'}Example.${extension[name]}`,
    css: 'packages/css-only/styles.css',
  }
  assert.equal(await card(name).getByRole('tablist', { name: `${frameworks[name]} source files`, exact: true }).getByRole('tab').count(), 2)
  for (const [id, path] of Object.entries(files)) {
    await page.locator(`#${name}-source-tab-${id}`).click()
    const expected = await readFile(path, 'utf8')
    await until(() => card(name).locator('[data-testid="css-source"]').textContent(), expected, `${name}/${example}/${id}: exact bytes`)
    assert.equal(await card(name).locator('.source-file-path').textContent(), path)
    await card(name).getByLabel('Copy source', { exact: true }).click()
    await until(() => page.evaluate(() => navigator.clipboard.readText()), expected, `${name}/${id}: clipboard`)
    evidence.sourceFiles.push({ framework: name, component: example, tab: id, path, bytes: Buffer.byteLength(expected) })
  }
}
try {
  await page.goto(`${baseURL}/#switch`)
  assert.equal(await page.locator('iframe.framework-frame').count(), 5)
  assert.equal(await page.getByLabel('Destyler framework', { exact: true }).count(), 0)
  const nodes = {}, runtime = `persistent-${Date.now()}`
  for (const side of sides) {
    await ready(side)
    nodes[side] = await frameElement(side).elementHandle()
    await frame(side).locator('body').evaluate((el, value) => { el.ownerDocument.defaultView.__previewTest = value }, `${runtime}-${side}`)
    await switchTest(side)
  }
  const preserved = async () => {
    assert.equal(await page.locator('iframe.framework-frame').count(), 5)
    for (const side of sides) {
      assert.equal(await nodes[side].evaluate(el => el.isConnected), true, `${side}: iframe node persists`)
      assert.equal(await frame(side).locator('body').evaluate(el => el.ownerDocument.defaultView.__previewTest), `${runtime}-${side}`, `${side}: runtime persists`)
    }
  }
  await frame('reference').getByRole('switch', { name: 'Airplane mode' }).click()
  for (const name of Object.keys(frameworks)) {
    await page.locator(`#${name}-code-tab`).click()
    for (const other of Object.keys(frameworks)) await view(other, other === name)
    await inspectFiles(name, 'switch')
    for (const [from, key, to] of [['css','ArrowRight','component'], ['component','ArrowLeft','css'], ['css','Home','component'], ['component','End','css']]) {
      await page.locator(`#${name}-source-tab-${from}`).press(key)
      assert.equal(await page.locator(`#${name}-source-tab-${to}`).getAttribute('aria-selected'), 'true')
      assert.equal(await focused(page.locator(`#${name}-source-tab-${to}`)), true)
    }
    for (const [from, key, to] of [['code','ArrowLeft','preview'], ['preview','End','code'], ['code','Home','preview']]) {
      await page.locator(`#${name}-${from}-tab`).press(key)
      assert.equal(await focused(page.locator(`#${name}-${to}-tab`)), true)
      await view(name, to === 'code')
      for (const other of Object.keys(frameworks).filter(other => other !== name)) await view(other, false)
    }
    await preserved()
    assert.equal(await state(frame('reference').getByRole('switch', { name: 'Airplane mode' })), true, 'Reference state preserved through code operations')
    evidence.frameworks.push(name)
  }
  for (const side of sides) await theme(side, 'dark')
  await page.getByLabel('All light', { exact: true }).click()
  for (const side of sides) {
    const label = `Toggle ${side === 'reference' ? 'shadcn/ui' : frameworks[side]} color mode`
    await page.getByLabel(label, { exact: true }).click()
    for (const other of sides) await theme(other, other === side ? 'dark' : 'light')
    await page.getByLabel(label, { exact: true }).click()
  }
  evidence.checks.push('Five simultaneously live frameworks, independent view/file/theme controls, exact sources and clipboard, keyboard navigation, preserved reference state and every iframe runtime')
  await screenshot('desktop-switch')
  await page.locator('#react-code-tab').click()
  await page.locator('#solid-code-tab').click()
  for (const example of ['dialog', 'switch', 'dialog']) {
    await navigate(example)
    for (const name of Object.keys(frameworks)) {
      await view(name, ['react', 'solid'].includes(name))
      await until(() => page.locator(`#${name}-source-tab-component`).getAttribute('aria-selected'), 'true', 'Component navigation resets every source')
      const path = `examples/css-only/${name}/${example === 'switch' ? 'Switch' : 'Dialog'}Example.${extension[name]}`
      assert.equal(await card(name).locator('[data-testid="css-source"]').textContent(), await readFile(path, 'utf8'))
    }
    await preserved()
  }
  for (const name of Object.keys(frameworks)) {
    await page.locator(`#${name}-code-tab`).click()
    await inspectFiles(name, 'dialog')
    await page.locator(`#${name}-preview-tab`).click()
  }
  for (const side of sides) await dialogTest(side)
  evidence.checks.push('All five real dialogs open/reopen, Escape/Close/outside dismiss, restore focus; component navigation preserves mixed views and resets all component sources')
  await page.getByLabel('All dark', { exact: true }).click()
  for (const side of sides) await theme(side, 'dark')
  await frame('react').getByRole('button', { name: 'Open dialog' }).click()
  await screenshot('desktop-dialog-dark')
  await frame('react').getByRole('dialog').press('Escape')
  await navigate('switch')
  await page.goBack()
  await until(() => page.locator('.comparison-grid').getAttribute('data-example'), 'dialog', 'Back restores dialog route')
  await page.goForward()
  await until(() => page.locator('.comparison-grid').getAttribute('data-example'), 'switch', 'Forward restores switch route')
  await preserved()
  await page.getByLabel('All light', { exact: true }).click()
  for (const side of sides) await theme(side, 'light')
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    for (const component of ['switch', 'dialog']) {
      await navigate(component)
      for (const side of sides) {
        assert.equal(await frame(side).locator('body').evaluate(el => el.ownerDocument.documentElement.scrollWidth <= el.ownerDocument.defaultView.innerWidth), true, `${width}/${side}: no canvas overflow`)
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${component}: no host overflow`)
      await screenshot(`mobile-${width}-${component}`)
    }
    for (const name of Object.keys(frameworks)) {
      await page.locator(`#${name}-code-tab`).click()
      for (const id of ['component', 'css']) {
        await page.locator(`#${name}-source-tab-${id}`).click()
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${name}/${id}: code does not overflow host`)
      }
      await screenshot(`mobile-${width}-${name}-code`)
      await page.locator(`#${name}-preview-tab`).click()
    }
  }
  evidence.checks.push('Global themes, real Back/Forward, desktop and 390px/320px preview/code overflow with actual screenshots')
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
