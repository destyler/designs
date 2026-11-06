import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Astro dev serves the prebuilt, isolated consumers. Production copies them into dist. */
export function consumerPreviews() {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url))
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }
  return {
    name: 'destyler-consumer-previews',
    configureServer(server) {
      for (const mount of ['vanilla-extract', 'css-only', 'reference', 'all-components']) {
        const root = resolve(dist, mount)
        server.middlewares.use('/' + mount, async (request, response, next) => {
        if (!['GET', 'HEAD'].includes(request.method)) return next()
        let pathname
        try { pathname = decodeURIComponent(request.url.split('?')[0]) } catch { return next() }
        // Astro serves newly exported source files from public, not an older dist copy.
        if (mount === 'all-components' && pathname.startsWith('/source/')) return next()
        if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) return next()
        if (pathname.endsWith('/')) pathname += 'index.html'
        try {
          const file = await realpath(resolve(root, '.' + pathname))
          if (!file.startsWith(resolve(root) + sep) || !(await stat(file)).isFile() || !types[extname(file)]) return next()
          response.setHeader('Content-Type', types[extname(file)])
          response.setHeader('X-Content-Type-Options', 'nosniff')
          if (request.method === 'HEAD') return response.end()
          createReadStream(file).on('error', () => response.destroy()).pipe(response)
        } catch { next() }
        })
      }
    },
  }
}
