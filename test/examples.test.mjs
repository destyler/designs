import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { serve } from '../scripts/serve.mjs'

async function request(url, method = 'GET') {
  const response = { writeHead(status, headers) { this.status = status; this.headers = headers }, end(body) { this.body = body } }
  await serve({ url, method }, response)
  return response
}

test('example server serves the gallery and all local module/style dependencies', async () => {
  for (const path of ['/examples/scoped-themes/', '/examples/scoped-themes/playground.js', '/examples/scoped-themes/playground.css', '/examples/scoped-themes/checks.html', '/examples/scoped-themes/checks.js', '/examples/scoped-themes/checks.css', '/src/portal-theme.js', '/styles/themes.css', '/']) {
    const response = await request(path)
    assert.equal(response.status, 200, path)
    assert.ok(response.body.length > 0)
    assert.equal(response.headers['X-Content-Type-Options'], 'nosniff')
  }
})
test('example server refuses hidden files, traversal, arbitrary files and writes', async () => {
  for (const path of ['/.git/config', '/package.json', '/scripts/serve.mjs', '/examples/../README.md', '/examples/%2e%2e/index.html', '/examples/%5c..%5cREADME.md', '/examples/%00', '/nope', '//etc/passwd']) {
    assert.equal((await request(path)).status, 404, path)
  }
  assert.equal((await request('/%', 'GET')).status, 400)
  assert.equal((await request('/', 'POST')).status, 405)
})
test('example server supports HEAD and ignores query strings', async () => {
  const response = await request('/examples/scoped-themes/?view=gallery', 'HEAD')
  assert.equal(response.status, 200)
  assert.equal(response.body, undefined)
  assert.equal(response.headers['Content-Type'], 'text/html; charset=utf-8')
})
test('gallery imports the actual theme and portal implementation, with no framework claims', async () => {
  const html = await readFile(new URL('../examples/scoped-themes/index.html', import.meta.url), 'utf8')
  const js = await readFile(new URL('../examples/scoped-themes/playground.js', import.meta.url), 'utf8')
  assert.match(html, /href="\.\.\/\.\.\/styles\/themes.css"/)
  assert.match(js, /from '\.\.\/\.\.\/src\/portal-theme.js'/)
  assert.match(html, /Native HTML prototype. Not a framework integration./)
  assert.doesNotMatch(html, /(?:src|href)="https?:\/\//)
  assert.match(js, /binding\?\.dispose\(\)/)
  assert.match(js, /if \(dialog.open\) return/)
})
test('browser suite reports pass/fail and includes real computed style checks', async () => {
  const js = await readFile(new URL('../examples/scoped-themes/checks.js', import.meta.url), 'utf8')
  assert.match(js, /win.getComputedStyle/)
  assert.match(js, /dialog.matches\(':modal'\)/)
  assert.match(js, /summary.dataset.status = failed \? 'failed' : 'passed'/)
  assert.match(js, /setTimeout.*10000/)
})
