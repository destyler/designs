import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, realpath } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const built = await realpath(fileURLToPath(new URL('../artifacts/storybook', import.meta.url)))
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
}
const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') return response.writeHead(405).end()
    const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
    const file = await realpath(resolve(built, path === '/' ? 'index.html' : '.' + path))
    if (!file.startsWith(built + sep)) return response.writeHead(404).end()
    const bytes = await readFile(file)
    response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' })
    response.end(request.method === 'HEAD' ? undefined : bytes)
  } catch {
    response.writeHead(404).end()
  }
})

const name = 'Email me product updates'
let browser
try {
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } })
  context.setDefaultTimeout(8000)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin })
  const errors = []

  // Exercise the actual manager rather than directly mounting the host.
  const manager = await context.newPage()
  manager.on('pageerror', error => errors.push(error.message))
  await manager.goto(`${origin}/?path=/story/ready-checkbox--react`)
  const canvas = manager.frameLocator('#storybook-preview-iframe')
  const codeTab = manager.getByRole('tab', { name: 'Code', exact: true })
  const code = manager.locator('.docblock-source').filter({ visible: true })
  // Storybook 10's native syntax highlighter uses a div inside pre, not a code tag.
  const snippet = code.locator('pre > div')
  const checked = canvas.getByRole('checkbox', { name, checked: true })
  await canvas.getByRole('checkbox', { name }).focus()
  await manager.keyboard.press('Space')
  await checked.waitFor({ state: 'attached' })
  await codeTab.click()
  await snippet.waitFor()
  assert.match(await snippet.textContent(), /from ['"]@destyler\/ready-prototype\/react['"]/)
  assert.match(await snippet.textContent(), /label="Email me product updates"/)
  assert.match(await snippet.textContent(), /name="product-updates"/)
  assert.doesNotMatch(await snippet.textContent(), /v-bind=|\{\s*\.\.\./)
  assert.equal(await canvas.locator('[data-ready-source]').count(), 0, 'No custom source card in the canvas')

  const downloaded = await context.request.get(`${origin}/styles/shadcn-ready.css`)
  assert.equal(downloaded.status(), 200)
  const css = await downloaded.text()
  assert.match(css, /data-scope="switch"/)
  assert.match(css, /height: 1.15rem;/)
  assert.match(css, /--rd-accent:/)
  assert.doesNotMatch(css, /@apply|destyler-ready-story/)

  await code.getByRole('button', { name: 'Copy', exact: true }).click()
  await code.getByRole('button', { name: 'Copied!', exact: true }).waitFor()
  assert.equal((await manager.evaluate(() => navigator.clipboard.readText())).trim(), (await snippet.textContent()).trim())

  const theme = canvas.locator('html')
  assert.equal(await theme.getAttribute('data-rd-theme'), 'shadcn')
  assert.match(await theme.evaluate(node => getComputedStyle(node).getPropertyValue('--rd-accent').trim()), /^oklch\(/)
  await manager.getByRole('button', { name: /Destyler Ready theme Shadcn/ }).click()
  await manager.getByText('Midnight', { exact: true }).click()
  await canvas.locator('html[data-rd-theme="midnight"]').waitFor()
  await checked.waitFor({ state: 'attached' })
  await snippet.waitFor()

  // The native Code panel must follow the selected story and its syntax.
  await manager.goto(`${origin}/?path=/story/ready-splitter--solid`)
  await canvas.locator('[data-ready-story="Splitter"][data-framework="solid"][data-status="ready"]').waitFor()
  await codeTab.click()
  for (const [framework, syntax] of [
    ['solid', /first=\{/],
    ['vue', /<template #first>/],
    ['svelte', /\{#snippet first\(\)\}/],
  ]) {
    if (framework !== 'solid') {
      await manager.locator(`[data-item-id="ready-splitter--${framework}"]`).click()
      await canvas.locator(`[data-ready-story="Splitter"][data-framework="${framework}"][data-status="ready"]`).waitFor()
    }
    await snippet.waitFor()
    await manager.waitForFunction(framework => document.querySelector('.docblock-source pre > div')?.textContent?.includes(`@destyler/ready-prototype/${framework}`), framework)
    const rendered = await snippet.textContent()
    assert.match(rendered, syntax)
    assert.match(rendered, /label="Files"/)
    assert.match(rendered, framework === 'vue' ? /:default-size="35"/ : /defaultSize=\{35\}/)
    assert.doesNotMatch(rendered, /v-bind=|\{\s*\.\.\./)
    await canvas.getByText('Files and folders', { exact: true }).waitFor()
    assert.equal(await canvas.locator('[data-ready-source]').count(), 0)
  }

  // Installation/implementation/theme links live on Storybook's native Docs
  // page rather than a custom card inserted in the component preview.
  await manager.goto(`${origin}/?path=/docs/ready-checkbox--docs`)
  const docs = manager.frameLocator('#storybook-preview-iframe')
  await docs.getByRole('link', { name: 'View implementation on GitHub' }).first().waitFor()
  assert.match(await docs.getByRole('link', { name: 'View implementation on GitHub' }).first().getAttribute('href'), /packages\/ready\/react\/index\.tsx$/)
  assert.match(await docs.getByRole('link', { name: 'Install Ready' }).first().getAttribute('href'), /docs\/ready-quickstart\.md$/)
  assert.match(await docs.getByRole('link', { name: 'Download Shadcn CSS' }).first().getAttribute('href'), /styles\/shadcn-ready\.css$/)

  // Check actual control geometry, not only theme tokens or canvas chrome.
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    await manager.goto(`${origin}/?path=/story/ready-switch--${framework}`)
    await canvas.locator('[data-ready-story="Switch"][data-status="ready"]').waitFor()
    const sw = canvas.locator('[data-scope="switch"][data-part="control"]')
    if (await theme.getAttribute('data-rd-theme') !== 'shadcn') {
      await manager.getByRole('button', { name: /Destyler Ready theme/ }).click()
      await manager.getByText('Shadcn', { exact: true }).click()
      await canvas.locator('html[data-rd-theme="shadcn"]').waitFor()
    }
    const geometry = await sw.evaluate(node => {
      const style = getComputedStyle(node)
      return { width: parseFloat(style.width), height: parseFloat(style.height) }
    })
    assert.equal(geometry.width, 32, `${framework}: actual Shadcn switch width`)
    assert.ok(Math.abs(geometry.height - 18.4) < 0.1, `${framework}: actual Shadcn switch height`)
    await manager.getByRole('button', { name: /Destyler Ready theme Shadcn/ }).click()
    await manager.getByText('Default', { exact: true }).click()
    await canvas.locator('html[data-rd-theme="default"]').waitFor()
    assert.equal(await sw.evaluate(node => parseFloat(getComputedStyle(node).width)), 42)
    await manager.getByRole('button', { name: /Destyler Ready theme Default/ }).click()
    await manager.getByText('Shadcn', { exact: true }).click()
    await canvas.locator('html[data-rd-theme="shadcn"]').waitFor()
    assert.equal(await sw.evaluate(node => parseFloat(getComputedStyle(node).width)), 32)
    await manager.emulateMedia({ forcedColors: 'active' })
    const input = canvas.locator('[data-scope="switch"][data-part="root"] input')
    const thumb = canvas.locator('[data-scope="switch"][data-part="thumb"]')
    const systemColor = keyword => thumb.evaluate((node, color) => {
      const probe = node.ownerDocument.createElement('span')
      probe.style.forcedColorAdjust = 'none'
      probe.style.backgroundColor = color
      node.ownerDocument.body.append(probe)
      const value = getComputedStyle(probe).backgroundColor
      probe.remove()
      return value
    }, keyword)
    assert.equal(await thumb.getAttribute('data-state'), 'unchecked')
    assert.equal(await thumb.evaluate(node => getComputedStyle(node).backgroundColor), await systemColor('CanvasText'))
    await input.focus()
    await manager.keyboard.press('Space')
    await canvas.locator('[data-scope="switch"][data-part="thumb"][data-state="checked"]').waitFor()
    assert.equal(await thumb.evaluate(node => getComputedStyle(node).backgroundColor), await systemColor('Highlight'))
    assert.ok(await input.evaluate(node => node.matches(':focus-visible')))
    const focus = await sw.evaluate(async node => {
      const animations = node.getAnimations()
      await Promise.allSettled(animations.map(animation => animation.finished))
      const style = getComputedStyle(node)
      return { color: style.outlineColor, width: style.outlineWidth, style: style.outlineStyle,
        offset: style.outlineOffset, transition: style.transitionProperty, animations: animations.length }
    })
    assert.equal(focus.transition, 'none', JSON.stringify(focus))
    assert.equal(focus.color, await systemColor('Highlight'), JSON.stringify(focus))
    assert.equal(focus.width, '3px', JSON.stringify(focus))
    assert.equal(focus.style, 'solid', JSON.stringify(focus))
    assert.equal(focus.offset, '3px', JSON.stringify(focus))
    await manager.keyboard.press('Space')
    await canvas.locator('[data-scope="switch"][data-part="thumb"][data-state="unchecked"]').waitFor()
    assert.equal(await thumb.evaluate(node => getComputedStyle(node).backgroundColor), await systemColor('CanvasText'))
    await manager.emulateMedia({ forcedColors: 'none' })
  }
  assert.deepEqual(errors, [], 'Unexpected uncaught errors in the source/preview stories')
  console.log('Storybook source: framework-native examples, GitHub links, exact clipboard, theme switch, and live story state passed.')
} finally {
  await browser?.close()
  if (server.listening) await new Promise(resolve => server.close(resolve))
}
