// A fresh child process ensures server imports never inherit a DOM shim.
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
const part = (scope, name) => `[data-scope="${scope}"][data-part="${name}"]`
let win, cleanup
try {
  assert.equal(result.domPresentAtStart, false)
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
  if (mode === 'ssr') {
    assert.equal(typeof window, 'undefined')
    assert.equal(typeof document, 'undefined')
    const html = await compiled.run()
    assert.equal((html.match(/data-part="control"/g) || []).length, 5)
    assert.match(html, /data-scope="dialog" data-part="trigger"/)
    assert.doesNotMatch(html, /data-part="(?:content|backdrop|positioner)"/, 'Mounted portal must not appear in SSR')
    assert.doesNotMatch(html, /\bclass="[^"\s][^"]*"/, 'No generated styling classes')
    await writeFile(htmlPath, html)
    if (framework === 'solid') await writeFile(htmlPath + '.bootstrap.js', compiled.hydrationScript.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
    result.htmlBytes = Buffer.byteLength(html)
    result.portalAbsentOnServer = true
    result.noStyleClasses = true
  } else {
    if (framework === 'solid') runInThisContext(await readFile(htmlPath + '.bootstrap.js', 'utf8'))
    const target = document.querySelector('#app')
    const originalControls = [...target.querySelectorAll(part('switch', 'control'))]
    const originalTrigger = target.querySelector(part('dialog', 'trigger'))
    cleanup = await compiled.run(target, error => result.errors.push(String(error)))
    await pause()
    const hydratedControls = [...target.querySelectorAll(part('switch', 'control'))]
    assert.equal(hydratedControls.length, originalControls.length)
    for (const [index, control] of originalControls.entries()) assert.equal(control, hydratedControls[index])
    assert.equal(originalTrigger, target.querySelector(part('dialog', 'trigger')))
    result.serverNodesRetained = true
    const content = document.querySelector(part('dialog', 'content'))
    const backdrop = document.querySelector(part('dialog', 'backdrop'))
    assert.ok(content && backdrop && !target.contains(content) && document.body.contains(content))
    result.portalMountedUnderBody = true
    const checkClosed = () => {
      for (const node of [content, backdrop]) { assert.equal(node.dataset.state, 'closed'); assert.equal(node.hidden, true) }
      assert.equal(originalTrigger.getAttribute('aria-expanded'), 'false')
    }
    checkClosed()
    result.initiallyHidden = true
    const input = target.querySelector('[data-case="small"] input')
    assert.equal(input.checked, false)
    input.click(); await pause(); assert.equal(input.checked, true)
    assert.equal(target.querySelector('[data-case="small"]').dataset.state, 'checked')
    input.click(); await pause(); assert.equal(input.checked, false)
    result.switchInteractive = true
    const controlled = target.querySelector('[data-case="updates"] input')
    controlled.click(); await pause(); assert.equal(controlled.checked, false)
    assert.equal(target.querySelector('[data-case="updates"]').dataset.state, 'unchecked')
    controlled.click(); await pause(); assert.equal(controlled.checked, true)
    result.controlledSwitchInteractive = true
    const disabled = target.querySelector('[data-case="disabled"] input')
    assert.equal(disabled.disabled, true)
    disabled.click(); await pause(); assert.equal(disabled.checked, true)
    assert.equal(target.querySelector('[data-case="disabled"]').dataset.state, 'checked')
    result.disabledSwitchPreserved = true
    const readonly = target.querySelector('[data-case="readonly"] input')
    assert.ok(target.querySelector('[data-case="readonly"]').hasAttribute('data-readonly'))
    readonly.click(); await pause(); assert.equal(readonly.checked, true)
    assert.equal(target.querySelector('[data-case="readonly"]').dataset.state, 'checked')
    result.readonlySwitchPreserved = true
    result.rtlCaseObservedDirection = target.querySelector('[data-case="rtl"] ' + part('switch', 'control')).getAttribute('dir')
    assert.equal(result.rtlCaseObservedDirection, 'rtl', 'LocaleProvider must expose RTL anatomy')
    assert.equal(target.querySelector('[data-case="rtl"] ' + part('switch', 'thumb')).getAttribute('dir'), 'rtl')
    for (let cycle = 0; cycle < 3; cycle++) {
      originalTrigger.click(); await pause()
      for (const node of [content, backdrop]) { assert.equal(node.dataset.state, 'open'); assert.equal(node.hidden, false) }
      assert.equal(originalTrigger.getAttribute('aria-expanded'), 'true')
      content.querySelector(part('dialog', 'close-trigger')).click(); await pause()
      checkClosed()
    }
    result.dialogOpenCloseCycles = 3
    assert.ok([...document.querySelectorAll('[data-scope="switch"], [data-scope="dialog"]')].every(node => !node.getAttribute('class')?.trim()), 'No styling classes after hydration')
    result.noStyleClasses = true
    await cleanup(); cleanup = undefined; await pause()
    assert.equal(document.querySelector(part('dialog', 'content')), null)
    assert.equal(document.querySelector(part('dialog', 'backdrop')), null)
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
