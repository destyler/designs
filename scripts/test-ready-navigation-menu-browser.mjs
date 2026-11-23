import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const folder = await mkdtemp(join(root, 'node_modules/.ready-navigation-menu-'))
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
    await writeFile(join(folder, 'index.html'), `<!doctype html><html lang="en"><title>Ready NavigationMenu</title><div id="app" data-rd-theme="default"></div><script type="module" src="./entry.js"></script></html>`)
    await writeFile(join(folder, 'entry.js'), `import '../../packages/ready/theme.css'; import '../../test/fixtures/ready-navigation-menu/${entry}'`)
    await build({ root: folder, configFile: false, plugins: await plugin[framework](), base: './', logLevel: 'error', build: { outDir: framework } })
    const page = await browser.newPage({ viewport: { width: 320, height: 600 } })
    const faults = []
    page.on('pageerror', error => faults.push(error.message))
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/${framework}/index.html`)
      const nav = page.getByRole('navigation', { name: 'Main navigation' })
      const products = nav.getByRole('button', { name: 'Products' })
      const docs = nav.getByRole('button', { name: 'Docs' })
      const desktop = nav.getByRole('link', { name: 'Desktop' })
      const guide = nav.getByRole('link', { name: 'Guide' })
      const focused = locator => locator.evaluate(node => document.activeElement === node)
      await nav.waitFor()
      assert.equal(await nav.getByRole('link', { name: 'Home' }).getAttribute('aria-current'), 'page', framework)
      assert.equal(await nav.getByRole('button', { name: 'Locked' }).isDisabled(), true, framework)
      assert.equal(await nav.evaluate(node => node.scrollWidth <= node.clientWidth), true, framework)
      await page.keyboard.press('Tab')
      assert.equal(await focused(nav.getByRole('link', { name: 'Home' })), true, framework)
      await page.keyboard.press('Tab')
      assert.equal(await focused(products), true, framework)
      await page.keyboard.press('Enter')
      assert.equal(await products.getAttribute('aria-expanded'), 'true', framework)
      await page.keyboard.press('Tab')
      assert.equal(await focused(desktop), true, framework)
      await page.keyboard.press('Escape')
      assert.equal(await products.getAttribute('aria-expanded'), 'false', framework)
      assert.equal(await focused(products), true, framework)
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-value') === 'docs')
      await page.keyboard.press('ArrowDown')
      await page.waitForFunction(() => document.activeElement?.getAttribute('href') === '#guide')
      assert.equal(await docs.getAttribute('aria-expanded'), 'true', framework)
      await page.keyboard.press('Tab')
      assert.equal(await focused(page.getByRole('button', { name: 'Outside nav' })), true, framework)
      assert.equal(await docs.getAttribute('aria-expanded'), 'false', framework)
      await docs.focus()
      await page.keyboard.press('ArrowDown')
      await page.waitForFunction(() => document.activeElement?.getAttribute('href') === '#guide')
      assert.equal(await guide.getAttribute('aria-current'), 'page', framework)
      await page.keyboard.press('Enter')
      await page.waitForURL(url => url.hash === '#guide')
      assert.equal(await docs.getAttribute('aria-expanded'), 'false', framework)
      assert.deepEqual(faults, [])
      console.log(`PASS ${framework}: native Tab/Enter, disclosure arrows and Escape, focus return and narrow navigation`)
    } finally { await page.close() }
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
  await rm(folder, { recursive: true, force: true })
}
