import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import postcss from 'postcss'
import { transform } from 'lightningcss'
import { Window } from 'happy-dom'
const root = fileURLToPath(new URL('../', import.meta.url))
const css = await readFile(join(root, 'examples/all-components/shared/theme.css'), 'utf8')
const catalog = JSON.parse(await readFile(join(root, 'examples/all-components/shared/catalog.json'), 'utf8'))
const ast = postcss.parse(css)
const report = { pass: false, rules: 0, declarations: 0, hiddenCases: 0, portalCases: 0, browser: false, limitations: ['CSS parsing and simulated styles are not visual acceptance, layout verification, rendered contrast measurements or screen-reader tests.'] }
ast.walkRules(() => report.rules++)
ast.walkDecls(() => report.declarations++)
const win = new Window({ settings: { disableCSSFileLoading: true, disableJavaScriptEvaluation: true } })
try {
  const result = transform({ filename: 'theme.css', code: Buffer.from(css), minify: true })
  assert.deepEqual(result.warnings, [])
  report.minifiedBytes = result.code.length
  assert.doesNotMatch(css, /@import\s/i)
  assert.doesNotMatch(css, /url\(\s*['"]?https?:/i)
  win.document.head.innerHTML = '<style>' + css + '</style>'
  for (const family of catalog.families) {
    assert.ok(css.includes(`=== ${family}:`), `Missing family styling: ${family}`)
    win.document.body.className = family + '-basic'
    win.document.body.innerHTML = '<div id="app"></div>'
    for (const part of ['root', 'content', 'indicator', 'trigger']) {
      const node = win.document.createElement('div')
      node.dataset.scope = family; node.dataset.part = part; node.hidden = true
      node.style.display = 'flex'
      win.document.querySelector('#app').append(node)
      assert.equal(win.getComputedStyle(node).display, 'none', `${family}/${part} honors native hidden`)
      report.hiddenCases++
    }
  }
  for (const theme of ['light', 'dark']) {
    win.document.documentElement.dataset.theme = theme
    win.document.body.className = 'dialog-basic'
    win.document.body.innerHTML = '<div id="app"></div><div data-scope="dialog" data-part="content"><button data-scope="dialog" data-part="close-trigger">Close</button></div>'
    const button = win.document.querySelector('button')
    const style = win.getComputedStyle(button)
    assert.notEqual(style.display, 'none'); assert.notEqual(style.opacity, '0')
    assert.notEqual(style.fontSize, '0px'); report.portalCases++
  }
  const layouts = []
  for (const id of ['app', 'root']) {
    win.document.body.className = 'separator-basic'
    win.document.body.innerHTML = `<div id="${id}" class="ds-example-content"></div>`
    const style = win.getComputedStyle(win.document.getElementById(id))
    layouts.push({ display: style.display, gap: style.gap, maxWidth: style.maxWidth })
  }
  assert.deepEqual(layouts[0], layouts[1], 'Framework mount containers use the same layout contract')
  report.mountLayouts = layouts; report.pass = true
} catch (error) { report.error = String(error.stack || error); process.exitCode = 1 }
finally { await win.happyDOM.close(); await mkdir(join(root, 'artifacts/all-components'), { recursive: true }); await writeFile(join(root, 'artifacts/all-components/styles.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2)) }
