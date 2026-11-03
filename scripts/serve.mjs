import { createServer } from 'node:http'
import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }

/** Small local example server. Never exposes repository metadata or arbitrary files. */
export async function serve(request, response) {
  const send = (status, content, type = 'text/plain; charset=utf-8') => {
    response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
    response.end(request.method === 'HEAD' ? undefined : content)
  }
  if (!['GET', 'HEAD'].includes(request.method)) return send(405, 'Method not allowed')
  let pathname
  try { pathname = decodeURIComponent(request.url.split('?')[0]) } catch { return send(400, 'Invalid path') }
  if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) return send(404, 'Not found')
  if (pathname.endsWith('/')) pathname += 'index.html'
  if (!(pathname === '/index.html' || ['/examples/', '/src/', '/styles/'].some(prefix => pathname.startsWith(prefix)))) return send(404, 'Not found')
  const type = types[extname(pathname)]
  if (!type) return send(404, 'Not found')
  try {
    const filename = await realpath(resolve(root, `.${pathname}`))
    if (!filename.startsWith(`${root}${sep}`) || !(await stat(filename)).isFile()) return send(404, 'Not found')
    send(200, await readFile(filename), type)
  } catch (error) {
    send(['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500, 'Unable to serve file')
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 4173)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new TypeError('PORT must be an integer from 1 to 65535')
  const server = createServer(serve)
  server.on('error', error => { console.error(`Example server failed: ${error.message}`); process.exitCode = 1 })
  server.listen(port, '127.0.0.1', () => {
    console.log(`Theme playground: http://127.0.0.1:${port}/examples/scoped-themes/`)
    console.log(`Browser checks:   http://127.0.0.1:${port}/examples/scoped-themes/checks.html`)
  })
}
