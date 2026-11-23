import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const folder = await mkdtemp(join(root, 'node_modules/.ready-switch-'))
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
    await writeFile(join(folder, 'index.html'), `<!doctype html><html lang="en"><title>Ready Switch</title><div id="app" data-rd-theme="default"></div><script type="module" src="./entry.js"></script></html>`)
    await writeFile(join(folder, 'entry.js'), `import '../../packages/ready/theme.css'; import '../../test/fixtures/ready-switch/${entry}'`)
    await build({ root: folder, configFile: false, plugins: await plugin[framework](), base: './', logLevel: 'error', build: { outDir: framework } })
    const page = await browser.newPage({ viewport: { width: 320, height: 600 } })
    const faults = []
    page.on('pageerror', error => faults.push(error.message))
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/${framework}/index.html`)
      const input = name => page.getByRole('switch', { name, exact: true })
      const airplane = input('Airplane mode')
      const disabled = input('Disabled')
      const fixed = input('Fixed')
      const consent = input('Consent')
      const invalid = input('Invalid')
      const track = name => page.locator('label[data-scope="switch"]').filter({ has: input(name) }).locator('[data-part="control"]')
      const formData = () => page.locator('form').evaluate(node => Object.fromEntries(new FormData(node)))
      assert.equal(await airplane.isChecked(), true, framework)
      assert.equal(await disabled.isDisabled(), true, framework)
      assert.equal(await airplane.evaluate(node => document.getElementById(node.getAttribute('aria-describedby'))?.textContent), 'Turns radios off')
      assert.equal(await invalid.getAttribute('aria-invalid'), 'true')
      assert.equal(await invalid.evaluate(node => node.validationMessage), 'Check the setting')
      assert.equal(await consent.evaluate(node => node.validity.valueMissing), true)
      assert.deepEqual(await formData(), { radios: 'off' }, framework)
      await page.keyboard.press('Tab')
      assert.equal(await airplane.evaluate(node => document.activeElement === node), true)
      assert.equal(await track('Airplane mode').evaluate(node => getComputedStyle(node).outlineStyle), 'solid')
      await page.keyboard.press('Space')
      assert.equal(await airplane.isChecked(), false)
      assert.deepEqual(await formData(), {})
      await page.locator('form').evaluate(node => node.reset())
      await page.waitForFunction(() => document.querySelector('input[name=radios]').checked)
      assert.deepEqual(await formData(), { radios: 'off' })
      await page.getByText('Airplane mode', { exact: true }).click()
      assert.equal(await airplane.isChecked(), false, framework)
      await track('Fixed').click()
      await page.waitForFunction(() => document.querySelector('[data-proposed]').textContent === 'true')
      assert.equal(await fixed.isChecked(), false, framework)
      assert.equal(await track('Fixed').getAttribute('data-state'), 'unchecked')
      await track('Consent').click()
      assert.equal(await consent.evaluate(node => node.validity.valueMissing), false)
      assert.deepEqual(await formData(), { consent: 'on' })
      const color = await track('Consent').evaluate(node => getComputedStyle(node).backgroundColor)
      await page.locator('#app').evaluate(node => { node.dataset.rdTheme = 'midnight' })
      assert.notEqual(await track('Consent').evaluate(node => getComputedStyle(node).backgroundColor), color)
      assert.equal(await consent.isChecked(), true)
      assert.deepEqual(faults, [])
      console.log(`PASS ${framework}: accessible switch, native keyboard, validation/reset/FormData, controlled veto, isolated tokens`)
    } finally { await page.close() }
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
  await rm(folder, { recursive: true, force: true })
}
