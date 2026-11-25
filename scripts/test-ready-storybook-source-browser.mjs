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
  const code = canvas.locator('[data-ready-source]')
  const snippet = code.locator('pre code')
  const summary = code.getByText('Usage code', { exact: true })
  const checked = canvas.getByRole('checkbox', { name, checked: true })
  await canvas.getByRole('checkbox', { name }).focus()
  await manager.keyboard.press('Space')
  await checked.waitFor({ state: 'attached' })
  await summary.focus()
  await manager.keyboard.press('Enter')
  await snippet.waitFor()
  assert.match(await snippet.textContent(), /from '@destyler\/ready-prototype\/react'/)
  assert.match(await snippet.textContent(), /Email me product updates/)
  assert.match(await code.getByRole('link', { name: 'View implementation on GitHub' }).getAttribute('href'), /\/react\/index\.tsx$/)
  const themeAsset = code.getByRole('link', { name: 'Download Shadcn CSS' })
  assert.equal(await themeAsset.getAttribute('download'), 'shadcn-ready.css')
  const downloaded = await context.request.get(`${origin}/styles/shadcn-ready.css`)
  assert.equal(downloaded.status(), 200)
  const css = await downloaded.text()
  assert.match(css, /data-scope="switch"/)
  assert.match(css, /height: 1.15rem;/)
  assert.match(css, /--rd-accent:/)
  assert.doesNotMatch(css, /@apply|destyler-ready-story/)
  assert.match(await code.getByRole('link', { name: 'Install Ready' }).getAttribute('href'), /\/docs\/ready-quickstart\.md$/)

  await code.getByRole('button', { name: 'Copy code' }).click()
  await code.getByRole('status').getByText('Code copied.', { exact: true }).waitFor()
  assert.equal(await snippet.evaluate(() => navigator.clipboard.readText()), await snippet.textContent())

  const theme = canvas.locator('html')
  assert.equal(await theme.getAttribute('data-rd-theme'), 'shadcn')
  assert.match(await theme.evaluate(node => getComputedStyle(node).getPropertyValue('--rd-accent').trim()), /^oklch\(/)
  await manager.getByRole('button', { name: /Destyler Ready theme Shadcn/ }).click()
  await manager.getByText('Midnight', { exact: true }).click()
  await canvas.locator('html[data-rd-theme="midnight"]').waitFor()
  await checked.waitFor({ state: 'attached' })
  await snippet.waitFor()
  await summary.click()
  await snippet.waitFor({ state: 'hidden' })
  await checked.waitFor({ state: 'attached' })

  // The selected story changes the shown syntax, including real named slots.
  // First use the public URL to expand Splitter from the sidebar, then switch.
  await manager.goto(`${origin}/?path=/story/ready-splitter--solid`)
  await canvas.locator('[data-ready-story="Splitter"][data-framework="solid"][data-status="ready"]').waitFor()
  await summary.click()
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
    const rendered = await snippet.textContent()
    assert.ok(rendered.includes(`from '@destyler/ready-prototype/${framework}'`))
    assert.match(rendered, syntax)
    await canvas.getByText('Files and folders', { exact: true }).waitFor()
    assert.match(await code.getByRole('link', { name: 'View implementation on GitHub' }).getAttribute('href'), new RegExp(`/${framework}/Splitter\\.`))
  }
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
  }
  assert.deepEqual(errors, [], 'Unexpected uncaught errors in the source/preview stories')
  console.log('Storybook source: framework-native examples, GitHub links, exact clipboard, theme switch, and live story state passed.')
} finally {
  await browser?.close()
  if (server.listening) await new Promise(resolve => server.close(resolve))
}
