/** Actual Showcase SSR + hydration in Happy DOM; no claims about browser layout/focus. */
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { runInThisContext } from 'node:vm'
const [framework, mode, dir, resultPath] = process.argv.slice(2)
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
    win = new Window({ url: 'http://localhost/?showcase=1&component=switch&theme=light', settings: { disableCSSFileLoading: true } })
    for (const key of Object.getOwnPropertyNames(win)) {
      if (['window', 'document', 'navigator', 'location', 'parent'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|KeyboardEvent|MessageEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
        try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
      }
    }
    for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
    globalThis.window = win; globalThis.document = win.document
    document.body.innerHTML = `<div id="app">${await readFile(htmlPath, 'utf8')}</div>`
  }
  const compiled = await import(pathToFileURL(join(dir, `${framework}-${mode}.mjs`)))
  if (mode === 'ssr') {
    assert.equal(typeof window, 'undefined')
    assert.equal(typeof document, 'undefined')
    const html = await compiled.run()
    assert.match(html, /data-part="control"/)
    assert.match(html, /Airplane mode/)
    assert.match(html, /data-showcase/)
    assert.doesNotMatch(html, /\bclass="[^"\s][^"]*"/, 'No styling classes in actual Showcase SSR')
    assert.doesNotMatch(html, /Notifications|Marketing|showcase-card|showcase-status|data-portal-owner/)
    assert.equal((html.match(/role="switch"/g) || []).length, 1)
    await writeFile(htmlPath, html)
    if (framework === 'solid') await writeFile(htmlPath + '.bootstrap.js', compiled.hydrationScript.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
    result.htmlBytes = Buffer.byteLength(html)
    result.singleComponentSSRWithoutBrowserGlobals = true
  } else {
    if (framework === 'solid') runInThisContext(await readFile(htmlPath + '.bootstrap.js', 'utf8'))
    const target = document.querySelector('#app')
    const originalControl = target.querySelector('[data-scope="switch"][data-part="control"]')
    const originalInput = target.querySelector('input[role="switch"]')
    cleanup = await compiled.run(target, error => result.errors.push(String(error)))
    await pause()
    assert.equal(originalControl, target.querySelector('[data-scope="switch"][data-part="control"]'))
    assert.equal(originalInput, target.querySelector('input[role="switch"]'))
    result.serverNodesRetained = true
    const noClasses = () => assert.ok([...document.querySelectorAll('#app [class], [data-portal-owner][class], [data-portal-owner] [class]')].every(node => !node.getAttribute('class')?.trim()), 'Showcase and native components need no design classes')
    noClasses()
    assert.equal(document.documentElement.dataset.theme, 'light')
    assert.equal(target.querySelectorAll('[role="switch"]').length, 1)
    assert.equal(originalInput.checked, false)
    originalInput.click(); await pause(); assert.equal(originalInput.checked, true)
    originalInput.click(); await pause(); assert.equal(originalInput.checked, false)
    result.switchInputClickInteractive = true
    const send = (data, origin = win.location.origin, source = win.parent) => win.dispatchEvent(new win.MessageEvent('message', { data, origin, source }))
    const dialogDark = { type: 'destyler:showcase', component: 'dialog', theme: 'dark' }
    send(dialogDark, 'https://untrusted.invalid'); await pause()
    assert.ok(target.querySelector('input[role="switch"]'), 'Foreign origin ignored')
    send(dialogDark, win.location.origin, null); await pause()
    assert.ok(target.querySelector('input[role="switch"]'), 'Wrong source ignored')
    send({ ...dialogDark, component: 'unknown' }); await pause()
    assert.ok(target.querySelector('input[role="switch"]'), 'Invalid component ignored')
    send({ ...dialogDark, theme: 'invalid' }); await pause()
    assert.ok(target.querySelector('input[role="switch"]'), 'Invalid theme ignored')
    send(dialogDark); await pause()
    assert.equal(target.querySelector('input[role="switch"]'), null)
    assert.equal(target.querySelector('main').dataset.theme, 'dark')
    result.validatedMessageChangesComponent = true
    const portal = document.querySelector(`[data-portal-owner="${framework}"]`)
    assert.ok(portal && document.body.contains(portal) && !target.contains(portal))
    assert.equal(document.documentElement.dataset.theme, 'dark')
    noClasses()
    const assertClosed = () => {
      const closedParts = portal.querySelectorAll('[data-part="content"], [data-part="backdrop"]')
      assert.equal(closedParts.length, 2)
      for (const node of closedParts) {
        assert.equal(node.dataset.state, 'closed')
        assert.equal(node.hidden, true)
      }
    }
    assertClosed()
    const trigger = target.querySelector('[data-part="trigger"]')
    assert.equal(trigger.textContent, 'Open dialog')
    for (let iteration = 0; iteration < 2; iteration++) {
      trigger.click(); await pause()
      const content = portal.querySelector('[data-part="content"][data-state="open"]')
      assert.ok(content)
      assert.equal(content.hidden, false)
      assert.equal(content.dataset.demoDialog, framework)
      noClasses()
      assert.equal(content.querySelector('[data-part="title"]').textContent, 'Dialog title')
      assert.equal(content.querySelector('[data-part="description"]').textContent, 'This is a dialog description.')
      const close = content.querySelector('[data-part="close-trigger"]')
      assert.equal(close.textContent, 'Close')
      close.click(); await pause()
      assert.equal(portal.querySelector('[data-part="content"][data-state="open"]'), null)
      assertClosed()
    }
    result.dialogOpenCloseReopen = true
    send({ ...dialogDark, theme: 'light' }); await pause()
    assert.equal(target.querySelector('main').dataset.theme, 'light')
    assert.equal(document.documentElement.dataset.theme, 'light')
    noClasses()
    result.documentThemeUpdatesForBodyPortal = true
    result.noStylingClasses = true
    send({ type: 'destyler:showcase', component: 'switch', theme: 'light' }); await pause()
    assert.equal(target.querySelectorAll('[role="switch"]').length, 1)
    assert.equal(document.querySelector('[data-portal-owner]'), null)
    assert.doesNotMatch(target.textContent, /Notifications|Marketing|Settings|preferences/)
    result.componentChangeCleansPortal = true
    await cleanup(); cleanup = undefined; await pause()
    assert.equal(document.querySelector('[data-portal-owner]'), null)
    assert.equal(document.documentElement.getAttribute('data-theme'), null, 'Unmount restores original document theme')
    send(dialogDark); await pause()
    assert.equal(document.documentElement.getAttribute('data-theme'), null, 'Disposed showcase no longer processes messages')
    result.themeAndListenerCleanup = true
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
