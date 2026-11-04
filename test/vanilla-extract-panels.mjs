import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { runInThisContext } from 'node:vm'
const [framework, mode, dir, stylesEntry, resultPath] = process.argv.slice(2)
const result = { framework, mode, domPresentAtStart: typeof window !== 'undefined', errors: [], warnings: [] }
const originalError = console.error, originalWarn = console.warn
console.error = (...args) => result.errors.push(args.map(String).join(' '))
console.warn = (...args) => result.warnings.push(args.map(String).join(' '))
const pause = () => new Promise(resolve => setTimeout(resolve, 100))
const htmlPath = join(dir, `${framework}-ssr.html`)
let win, cleanup
try {
  if (mode === 'hydrate') {
    const { Window } = await import('happy-dom')
    win = new Window({ url: 'http://localhost/', settings: { disableCSSFileLoading: true } })
    for (const key of Object.getOwnPropertyNames(win)) {
      if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|KeyboardEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
        try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
      }
    }
    for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
    globalThis.window = win; globalThis.document = win.document
    document.body.innerHTML = `<div id="app">${await readFile(htmlPath, 'utf8')}</div>`
  }
  const compiled = await import(pathToFileURL(join(dir, `${framework}-${mode}.mjs`)))
  const { classes, themes } = await import(pathToFileURL(stylesEntry))
  if (mode === 'ssr') {
    assert.equal(typeof window, 'undefined')
    const html = await compiled.run()
    assert.match(html, /data-part="control"/)
    assert.match(html, /data-action="open-dialog"/)
    assert.ok(!html.includes('data-portal-owner='), 'Mounted portal must not appear in SSR')
    await writeFile(htmlPath, html)
    if (framework === 'solid') await writeFile(htmlPath + '.bootstrap.js', compiled.hydrationScript.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
    result.htmlBytes = Buffer.byteLength(html)
    result.portalAbsentOnServer = true
  } else {
    if (framework === 'solid') runInThisContext(await readFile(htmlPath + '.bootstrap.js', 'utf8'))
    const target = document.querySelector('#app')
    const originalControl = target.querySelector('[data-scope="switch"][data-part="control"]')
    const originalTrigger = target.querySelector('[data-action="open-dialog"]')
    cleanup = await compiled.run(target, error => result.errors.push(String(error)))
    await pause()
    assert.equal(originalControl, target.querySelector('[data-scope="switch"][data-part="control"]'))
    assert.equal(originalTrigger, target.querySelector('[data-action="open-dialog"]'))
    result.serverNodesRetained = true
    const panel = target.querySelector('[data-panel]')
    const portal = document.querySelector('[data-portal-owner="actual-panel"]')
    assert.ok(portal && document.body.contains(portal) && !target.contains(portal), 'Portal must be outside hydration target under body')
    assert.ok(themes.light.split(' ').every(c => portal.classList.contains(c)))
    result.portalMountedUnderBody = true
    const controls = panel.querySelectorAll('.fixture-controls input[type="checkbox"]')
    controls[0].click(); controls[1].click(); controls[2].click()
    await pause()
    for (const node of [panel, portal]) {
      assert.equal(node.dataset.theme, 'dark')
      assert.ok(themes.dark.split(' ').every(c => node.classList.contains(c)))
      assert.equal(node.style.getPropertyValue('--dy-primary'), '#7c3aed')
      assert.equal(node.style.getPropertyValue('--dy-radius'), '1rem')
    }
    assert.ok(originalTrigger.classList.contains('fixture-utility-override'))
    result.themeAndTokenPropagation = true
    const input = panel.querySelector('[data-case="small"] input[role="switch"]')
    assert.equal(input.checked, false)
    input.click(); await pause(); assert.equal(input.checked, true)
    result.switchInteractive = true
    const disabled = panel.querySelector('[data-case="disabled"] input[role="switch"]')
    assert.equal(disabled.disabled, true)
    disabled.click(); await pause(); assert.equal(disabled.checked, true)
    result.disabledSwitchPreserved = true
    originalTrigger.click(); await pause()
    let content = portal.querySelector('[data-part="content"][data-state="open"]')
    assert.ok(content)
    assert.ok(content.classList.contains(classes.dialogContent))
    portal.querySelector('[data-part="close-trigger"]').click(); await pause()
    assert.equal(portal.querySelector('[data-part="content"][data-state="open"]'), null)
    originalTrigger.click(); await pause()
    assert.ok(portal.querySelector('[data-part="content"][data-state="open"]'))
    result.dialogOpenCloseReopen = true
    portal.querySelector('[data-part="close-trigger"]').click(); await pause()
    controls[0].click(); controls[1].click(); controls[2].click(); await pause()
    for (const node of [panel, portal]) {
      assert.equal(node.dataset.theme, 'light')
      assert.ok(themes.light.split(' ').every(c => node.classList.contains(c)))
      assert.equal(node.style.getPropertyValue('--dy-primary'), '')
    }
    result.themeAndTokenReset = true
    await cleanup(); cleanup = undefined; await pause()
    assert.equal(document.querySelector('[data-portal-owner]'), null)
    result.portalRemovedOnUnmount = true
  }
  assert.deepEqual(result.errors, [], 'Console errors during SSR/hydration')
  assert.deepEqual(result.warnings, [], 'Console warnings during SSR/hydration')
  result.pass = true
} catch (error) { result.pass = false; result.exception = String(error.stack || error) }
finally {
  if (cleanup) { try { await cleanup() } catch {} }
  console.error = originalError; console.warn = originalWarn
  if (win) await win.happyDOM.close()
  await writeFile(resultPath, JSON.stringify(result, null, 2) + '\n')
}
