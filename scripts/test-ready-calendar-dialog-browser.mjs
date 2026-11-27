import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'
import { runReadyFixture } from '../test/helpers/ready-browser-fixture.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const worker = fileURLToPath(import.meta.url)
const markup = `<><Calendar label="Outside dates" defaultValue="2026-06-15" /><Dialog trigger="Open dates" title="Choose dates" description="Select a travel date"><Calendar label="Travel dates" defaultValue="2026-06-30" /></Dialog></>`
const fixtures = {
  react: `import React from 'react'; import {createRoot} from 'react-dom/client'; import { Calendar, Dialog } from '../../packages/ready/react'; createRoot(document.getElementById('app')).render(${markup})`,
  solid: `import {render} from 'solid-js/web'; import { Calendar, Dialog } from '../../packages/ready/solid'; render(() => ${markup}, document.getElementById('app'))`,
  vue: `<script setup>import Calendar from '../../packages/ready/vue/Calendar.vue'; import Dialog from '../../packages/ready/vue/Dialog.vue';</script><template><Calendar label="Outside dates" default-value="2026-06-15" /><Dialog trigger="Open dates" title="Choose dates" description="Select a travel date"><Calendar label="Travel dates" default-value="2026-06-30" /></Dialog></template>`,
  svelte: `<script>import Calendar from '../../packages/ready/svelte/Calendar.svelte'; import Dialog from '../../packages/ready/svelte/Dialog.svelte';</script><Calendar label="Outside dates" defaultValue="2026-06-15" /><Dialog trigger="Open dates" title="Choose dates" description="Select a travel date"><Calendar label="Travel dates" defaultValue="2026-06-30" /></Dialog>`,
}

if (process.argv[2] === '--ready-fixture') {
  const bundle = await readFile(process.argv[3])
  const server = createServer(async (req, res) => {
    if (req.url === '/fixture.mjs') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(bundle)
    } else if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end('<!doctype html><html><body><div id="app"></div><script type="module" src="/fixture.mjs"></script></body></html>')
    } else if (/^\/[a-zA-Z0-9_.-]+\.m?js$/.test(req.url)) {
      try { const bytes = await readFile(join(dirname(process.argv[3]), req.url.slice(1))); res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(bytes) }
      catch { res.writeHead(404).end() }
    } else res.writeHead(404).end()
  })
  let browser
  try {
    await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), timeout: 15000 })
    const page = await browser.newPage()
    page.setDefaultTimeout(6000)
    const errors = []
    page.on('pageerror', error => { errors.push(error.message); console.error('Page error:', error.message) })
    page.on('requestfailed', request => console.error('Request failed:', request.url(), request.failure()?.errorText))
    await page.goto(`http://127.0.0.1:${server.address().port}/`)
    const outside = page.locator('[role="grid"][aria-label="Outside dates"]')
    const trigger = page.getByRole('button', { name: 'Open dates', exact: true })
    await outside.waitFor()
    await trigger.focus()
    const opener = await trigger.elementHandle()
    assert.ok(await opener.evaluate(node => node === document.activeElement))
    for (let repeat = 0; repeat < 2; repeat++) {
      await page.keyboard.press('Enter')
      const modal = page.getByRole('dialog', { name: 'Choose dates', exact: true })
      await modal.waitFor()
      const grid = modal.getByRole('grid', { name: 'Travel dates', exact: true })
      await grid.waitFor()
      // Do not race the enclosing Dialog's deferred focus trap.
      await modal.locator('[data-scope="calendar"][data-part="prev-trigger"]:focus').waitFor()
      const focused = grid.locator('[data-part="table-cell-trigger"][tabindex="0"]')
      const original = await focused.getAttribute('data-value')
      await focused.focus()
      await page.keyboard.press('ArrowRight')
      const next = grid.locator('[data-part="table-cell-trigger"][tabindex="0"]:focus')
      await next.waitFor()
      assert.notEqual(await next.getAttribute('data-value'), original)
      if (repeat === 0) assert.match(await next.getAttribute('data-value'), /^2026-07-01$/)
      assert.equal(await outside.locator('[data-part="table-cell-trigger"][tabindex="0"]').getAttribute('data-value'), '2026-06-15')
      await page.keyboard.press('Escape')
      await modal.waitFor({ state: 'hidden' })
      await page.waitForFunction(node => document.activeElement === node, opener)
      assert.equal(await outside.locator('[data-part="table-cell-trigger"][data-selected]').getAttribute('data-value'), '2026-06-15')
    }
    await page.waitForTimeout(100)
    assert.deepEqual(errors, [], 'No page errors in nested Ready Calendar / Dialog')
  } finally {
    await browser?.close()
    await new Promise(resolve => server.close(resolve))
  }
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    await runReadyFixture(root, framework, fixture, worker, { define: { 'process.env.NODE_ENV': JSON.stringify('production') }, timeout: 45_000 })
    console.log(`Ready Calendar within Dialog: ${framework} passed`)
  }
}
