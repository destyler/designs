import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { serve } from './serve.mjs'

const server = createServer(serve)
try {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const origin = `http://127.0.0.1:${server.address().port}`
  for (const path of ['/examples/scoped-themes/', '/examples/scoped-themes/playground.js', '/examples/scoped-themes/playground.css', '/examples/scoped-themes/checks.html', '/examples/scoped-themes/checks.js', '/examples/scoped-themes/checks.css', '/src/portal-theme.js', '/styles/themes.css']) {
    const response = await fetch(`${origin}${path}`)
    assert.equal(response.status, 200, path)
    assert.ok((await response.text()).length > 0, path)
  }
  const denied = await fetch(`${origin}/.git/config`)
  assert.equal(denied.status, 404)
  await denied.text()
  console.log('HTTP smoke passed: 8 example/assets routes and repository-metadata protection.')
} finally {
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
