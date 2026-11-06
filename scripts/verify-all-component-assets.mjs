import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
const root = fileURLToPath(new URL('../', import.meta.url))
const dist = join(root, 'dist')
const catalog = JSON.parse(await readFile(join(root, 'examples/all-components/shared/catalog.json'), 'utf8'))
const origin = 'https://validation.invalid'
const queue = ['/components/', ...catalog.frameworks.map(framework => `/all-components/${framework}/`)]
const visited = new Set()
const report = { pass: false, sources: 0, sourceFiles: 0, assets: [], externalAssets: [], browser: false }
const win = new Window({ settings: { disableJavaScriptEvaluation: true, disableIframePageLoading: true, disableCSSFileLoading: true } })
try {
  while (queue.length) {
    const target = queue.shift()
    const url = new URL(target, origin)
    if (url.protocol === 'data:' || url.protocol === 'blob:') continue
    if (url.origin !== origin) { report.externalAssets.push(url.href); continue }
    let pathname = decodeURIComponent(url.pathname)
    if (pathname.endsWith('/')) pathname += 'index.html'
    if (visited.has(pathname)) continue
    visited.add(pathname)
    const path = resolve(dist, '.' + pathname)
    assert.ok(path.startsWith(dist + sep))
    const bytes = await readFile(path)
    report.assets.push({ path: pathname, bytes: bytes.length })
    const extension = extname(path)
    if (extension === '.html') {
      win.document.body.innerHTML = bytes.toString('utf8')
      for (const element of win.document.querySelectorAll('script[src], iframe[src], link[rel="stylesheet"][href], link[rel="modulepreload"][href]')) queue.push(new URL(element.getAttribute('src') || element.getAttribute('href'), url).href)
    } else if (extension === '.css') {
      for (const match of bytes.toString('utf8').matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) queue.push(new URL(match[1], url).href)
    } else if (extension === '.js') {
      for (const match of bytes.toString('utf8').matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.[^'"]+)['"]/g)) queue.push(new URL(match[1], url).href)
    }
  }
  assert.deepEqual(report.externalAssets, [])
  const expectedCss = await readFile(join(root, 'examples/all-components/shared/theme.css'), 'utf8')
  assert.equal(await readFile(join(dist, 'all-components/source/theme.css'), 'utf8'), expectedCss)
  for (const framework of catalog.frameworks) for (const family of catalog.families) {
    const source = JSON.parse(await readFile(join(dist, 'all-components/source', framework, family + '.json'), 'utf8'))
    assert.equal(source.family, family); assert.equal(source.framework, framework)
    const boundary = join(root, 'examples/all-components', framework)
    for (const file of source.files) {
      const path = resolve(boundary, file.name)
      assert.ok(path.startsWith(boundary + sep))
      assert.equal(file.code, await readFile(path, 'utf8'), `${framework}/${family}/${file.name} matches the actual source`)
      report.sourceFiles++
    }
    report.sources++
  }
  assert.equal(report.sources, 184)
  report.pass = true
} catch (error) { report.error = String(error.stack || error); process.exitCode = 1 }
finally { await win.happyDOM.close(); await mkdir(join(root, 'artifacts/all-components'), { recursive: true }); await writeFile(join(root, 'artifacts/all-components/assets.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2)) }
