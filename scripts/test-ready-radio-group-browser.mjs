import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const folder = await mkdtemp(join(root, 'node_modules/.ready-radio-group-'))
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const server = createServer(async (request, response) => {
  try {
    const relative = new URL(request.url, 'http://localhost').pathname.slice(1)
    if (!/^(react|vue|solid|svelte)\/(index\.html|assets\/[\w.-]+)$/.test(relative)) {
      response.writeHead(404).end()
      return
    }
    const content = await readFile(join(folder, relative))
    response.writeHead(200, { 'content-type': MIME[extname(relative)] || 'application/octet-stream' }).end(content)
  } catch {
    response.writeHead(404).end()
  }
})
let browser
try {
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject))
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })
  for (const framework of ['react', 'vue', 'solid', 'svelte']) {
    const entry = framework === 'react' || framework === 'solid' ? `${framework}.tsx` : `${framework}.ts`
    const plugin = {
      react: async () => [(await import('@vitejs/plugin-react')).default()],
      vue: async () => [(await import('@vitejs/plugin-vue')).default()],
      solid: async () => [(await import('vite-plugin-solid')).default()],
      svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
    }
    await writeFile(join(folder, 'index.html'), `<!doctype html><html lang="en"><title>Ready RadioGroup</title><div id="app" data-rd-theme="default"></div><script type="module" src="./entry.js"></script></html>`)
    await writeFile(join(folder, 'entry.js'), `import '../../packages/ready/theme.css'; import '../../test/fixtures/ready-radio-group/${entry}'`)
    await build({ root: folder, configFile: false, plugins: await plugin[framework](), base: './', logLevel: 'error', build: { outDir: framework } })
    const page = await browser.newPage({ viewport: { width: 320, height: 600 } })
    const faults = []
    page.on('pageerror', error => faults.push(error.message))
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/${framework}/index.html`)
      const group = name => page.getByRole('radiogroup', { name, exact: true })
      const radio = (name, option) => group(name).getByRole('radio', { name: option, exact: true })
      const control = (name, option) => group(name).locator('label[data-part="item"]').filter({ has: page.getByRole('radio', { name: option, exact: true }) }).locator('[data-part="item-control"]')
      const form = page.locator('form')
      const formData = () => form.evaluate(node => Object.fromEntries(new FormData(node)))
      await group('Schedule').waitFor()
      const ids = await page.locator('[role="radiogroup"] [id]').evaluateAll(elements => elements.map(node => node.id))
      assert.equal(new Set(ids).size, ids.length, framework)
      assert.equal(await radio('Schedule', 'Daily').isChecked(), true, framework)
      assert.equal(await radio('Schedule', 'Hourly').isDisabled(), true, framework)
      assert.equal(await radio('Locked', 'Daily').isDisabled(), true, framework)
      assert.equal(await group('Locked').getAttribute('aria-disabled'), 'true', framework)
      assert.equal(await group('Record').getAttribute('aria-required'), 'true', framework)
      assert.equal(await form.evaluate(node => node.checkValidity()), false, framework)
      assert.deepEqual(await formData(), { schedule: 'daily', fixed: 'daily' }, framework)
      await page.keyboard.press('Tab')
      assert.equal(await radio('Schedule', 'Daily').evaluate(node => document.activeElement === node), true, framework)
      assert.equal(await control('Schedule', 'Daily').evaluate(node => getComputedStyle(node).outlineStyle), 'solid', framework)
      await page.keyboard.press('ArrowDown')
      assert.equal(await radio('Schedule', 'Weekly').evaluate(node => document.activeElement === node), true, framework)
      assert.equal(await radio('Schedule', 'Weekly').isChecked(), true, framework)
      assert.equal(await control('Schedule', 'Weekly').getAttribute('data-state'), 'checked', framework)
      assert.equal((await formData()).schedule, 'weekly', framework)
      await group('Record').getByText('Weekly', { exact: true }).click()
      assert.equal(await radio('Record', 'Weekly').isChecked(), true, framework)
      assert.equal(await form.evaluate(node => node.checkValidity()), true, framework)
      assert.equal((await formData()).record, 'weekly', framework)
      await form.evaluate(node => node.reset())
      await page.waitForFunction(() => document.querySelector('input[name=schedule][value=daily]').checked
        && !document.querySelector('input[name=record]:checked'))
      assert.equal(await control('Schedule', 'Daily').getAttribute('data-state'), 'checked', framework)
      assert.equal(await control('Record', 'Weekly').getAttribute('data-state'), 'unchecked', framework)
      assert.equal(await form.evaluate(node => node.checkValidity()), false, framework)
      assert.deepEqual(await formData(), { schedule: 'daily', fixed: 'daily' }, framework)
      await group('Fixed').getByText('Weekly', { exact: true }).click()
      await page.waitForFunction(() => document.querySelector('[data-proposed]').textContent === 'weekly')
      assert.equal(await radio('Fixed', 'Weekly').isChecked(), false, framework)
      assert.equal(await radio('Fixed', 'Daily').isChecked(), true, framework)
      assert.equal(await control('Fixed', 'Weekly').getAttribute('data-state'), 'unchecked', framework)
      assert.equal((await formData()).fixed, 'daily', framework)
      await group('Managed').getByText('Weekly', { exact: true }).click()
      assert.equal(await radio('Managed', 'Weekly').isChecked(), true, framework)
      assert.equal((await formData()).managed, 'weekly', framework)
      await page.getByRole('button', { name: 'Clear managed' }).click()
      assert.equal(await radio('Managed', 'Weekly').isChecked(), false, framework)
      assert.equal(await control('Managed', 'Weekly').getAttribute('data-state'), 'unchecked', framework)
      assert.equal((await formData()).managed, undefined, framework)
      assert.deepEqual(faults, [])
      console.log(`PASS ${framework}: native required validation, keyboard, FormData/reset, disabled items/group and controlled acceptance/veto`)
    } finally { await page.close() }
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
  await rm(folder, { recursive: true, force: true })
}
