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

const frameworks = ['react', 'vue', 'solid', 'svelte']
const storyId = (name, framework) => `ready-${name.toLowerCase()}--${framework}`
const storyURL = (origin, id) => `${origin}/iframe.html?id=${id}&viewMode=story`
const hostFor = (canvas, name, framework) => canvas.locator(
  `[data-ready-story="${name}"][data-framework="${framework}"][data-status="ready"]`,
)
const active = locator => locator.evaluate(node => node === node.ownerDocument.activeElement)
const notice = canvas => canvas.getByText('Settings saved', { exact: true })

async function assertRendered(canvas, name, framework) {
  const host = hostFor(canvas, name, framework)
  // A connected host only guarantees the native mount call ran. React, for
  // example, can commit asynchronously after that point. Require a visible
  // descendant of the framework's mount target, not just its container.
  await host.locator(':scope > div > *:visible').first().waitFor()
  assert.equal(await host.count(), 1)
  assert.equal(await canvas.locator('html').getAttribute('data-rd-theme'), 'shadcn')
  return host
}

const verifiers = {
  async Checkbox(page, host) {
    const label = { name: 'Email me product updates', exact: true }
    const checkbox = host.getByRole('checkbox', label)
    await host.getByRole('checkbox', { ...label, checked: false }).waitFor({ state: 'attached' })
    await checkbox.focus()
    assert.ok(await active(checkbox), 'Checkbox has keyboard focus')
    await page.keyboard.press('Space')
    await host.getByRole('checkbox', { ...label, checked: true }).waitFor({ state: 'attached' })
    await page.keyboard.press('Space')
    await host.getByRole('checkbox', { ...label, checked: false }).waitFor({ state: 'attached' })
  },
  async Tabs(_page, host) {
    const overview = host.getByRole('tab', { name: 'Overview', exact: true })
    const members = host.getByRole('tab', { name: 'Members', exact: true })
    assert.equal(await overview.getAttribute('aria-selected'), 'true')
    await host.getByText('See recent activity.', { exact: true }).waitFor()
    await members.click()
    await host.getByText('Manage workspace members.', { exact: true }).waitFor()
    assert.equal(await members.getAttribute('aria-selected'), 'true')
    assert.equal(await overview.getAttribute('aria-selected'), 'false')
  },
  async Calendar(page, host) {
    const selected = host.locator('[data-part="table-cell-trigger"][data-selected]').first()
    const day = number => host.locator('[data-part="table-cell-trigger"]').filter({ hasText: new RegExp(`^${number}$`) }).first()
    assert.equal(await selected.innerText(), '15')
    await selected.focus()
    await page.keyboard.press('ArrowLeft')
    await day(14).and(host.locator(':focus')).waitFor()
    await page.keyboard.press('Enter')
    await day(14).and(host.locator('[data-selected]')).waitFor()
    await day(13).click()
    await day(13).and(host.locator('[data-selected]')).waitFor()
  },
  async Dialog(page, host) {
    const trigger = host.getByRole('button', { name: 'Review settings', exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Workspace settings', exact: true })
    await dialog.waitFor()
    await dialog.getByText('Only workspace owners can change these settings.', { exact: true }).waitFor()
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Review settings')
    assert.ok(await active(trigger), 'Dialog Escape restores focus to its trigger')
  },
  async Toast(page, host) {
    await host.getByRole('button', { name: 'Show notification', exact: true }).click()
    await notice(page).waitFor()
    await page.getByRole('button', { name: 'Dismiss Settings saved', exact: true }).click()
    await notice(page).waitFor({ state: 'hidden' })
  },
  async Splitter(_page, host) {
    await host.getByText('Files and folders', { exact: true }).waitFor()
    await host.getByText('Selected file details', { exact: true }).waitFor()
    await host.locator('[data-scope="splitter"][data-part="resize-trigger"]').waitFor()
  },
}

let browser
try {
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const index = await fetch(`${origin}/index.json`)
  assert.ok(index.ok, 'Build Storybook before running the browser check.')
  const { entries } = await index.json()
  const stories = Object.values(entries).filter(entry => entry.type === 'story')
  assert.equal(stories.length, 180, '45 Ready components × 4 runtimes')
  const names = [...new Set(stories.map(entry => entry.title.replace(/^Ready\//, '')))]
  assert.equal(names.length, 45)
  for (const name of names) {
    for (const framework of frameworks) {
      const id = storyId(name, framework)
      assert.ok(entries[id]?.type === 'story', `Missing story: ${id}`)
    }
  }

  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    timeout: 15000,
  })
  const context = await browser.newContext({ viewport: { width: 1120, height: 800 } })
  context.setDefaultTimeout(8000)
  const errors = []
  async function watchPage() {
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`))
    return page
  }

  const results = await Promise.allSettled(frameworks.map(async framework => {
    const page = await watchPage()
    for (const name of names) {
      const id = storyId(name, framework)
      try {
        const response = await page.goto(storyURL(origin, id), { waitUntil: 'domcontentloaded' })
        assert.ok(response?.ok())
        const host = await assertRendered(page, name, framework)
        await verifiers[name]?.(page, host)
      } catch (error) {
        throw new Error(`Storybook ${id}: ${error.message}`, { cause: error })
      }
    }
    await page.close()
  }))
  const failures = results.filter(result => result.status === 'rejected').map(result => result.reason)
  if (failures.length) throw new AggregateError(failures, failures.map(error => error.message).join('\n'))

  // The real Storybook manager changes stories within its preview frame.
  // Changing the runtime and back must dispose the prior toast host, which
  // enforces at most one host per document and owns any visible notification.
  const manager = await watchPage()
  await manager.goto(`${origin}/?path=/story/${storyId('Toast', 'react')}`)
  const canvas = manager.frameLocator('#storybook-preview-iframe')
  const initial = await assertRendered(canvas, 'Toast', 'react')
  await initial.getByRole('button', { name: 'Show notification', exact: true }).click()
  await notice(canvas).waitFor()
  for (const framework of ['svelte', 'react']) {
    await manager.locator(`[data-item-id="${storyId('Toast', framework)}"]`).click()
    const host = await assertRendered(canvas, 'Toast', framework)
    await notice(canvas).waitFor({ state: 'hidden' })
    await host.getByRole('button', { name: 'Show notification', exact: true }).click()
    await notice(canvas).waitFor()
  }

  assert.deepEqual(errors, [], 'Unexpected errors in the real Storybook and its canvases')
  console.log('Storybook: 180 native Ready stories rendered; six interaction samples passed in all four runtimes; manager remount passed.')
} finally {
  await browser?.close()
  if (server.listening) await new Promise(resolve => server.close(resolve))
}
