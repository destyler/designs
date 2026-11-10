import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { runInThisContext } from 'node:vm'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const [mode, family] = process.argv.slice(2)
const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '.verification')
const result = { family, pass: false, warnings: [], errors: [], interactions: [] }
console.error = (...args) => result.errors.push(args.map(String).join(' '))
console.warn = (...args) => result.warnings.push(args.map(String).join(' '))
process.on('uncaughtException', error => result.errors.push(error.stack || String(error)))
process.on('unhandledRejection', error => result.errors.push(error?.stack || String(error)))
let win, dispose
try {
  if (mode === 'ssr') {
    assert.equal(typeof document, 'undefined')
    const { run, bootstrap } = await import('./.verification/ssr.mjs')
    const html = run(family)
    assert.ok(html.length > 0)
    await writeFile(join(out, `${family}.html`), html)
    await writeFile(join(out, 'bootstrap.js'), bootstrap.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
    await writeFile(join(out, `${family}-ssr.json`), JSON.stringify({ htmlBytes: html.length, warnings: result.warnings, errors: result.errors }))
    assert.deepEqual(result.errors, [])
    assert.deepEqual(result.warnings, [])
  } else {
    const { Window } = await import('happy-dom')
    win = new Window({ url: 'http://localhost/', settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true } })
    for (const key of Object.getOwnPropertyNames(win)) {
      if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|FocusEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
        try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
      }
    }
    for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
    globalThis.window = win
    globalThis.document = win.document
    document.body.className = `${family}-basic`
    document.body.innerHTML = `<div id="app">${await readFile(join(out, `${family}.html`), 'utf8')}</div>`
    win.addEventListener('error', event => result.errors.push(String(event.error || event.message)))
    const target = document.getElementById('app')
    const before = [...target.querySelectorAll('[data-scope],button,input,select,textarea,a,img')]
    runInThisContext(await readFile(join(out, 'bootstrap.js'), 'utf8'))
    const { run } = await import('./.verification/hydrate.mjs')
    dispose = run(family, target)
    const settle = () => new Promise(resolve => setTimeout(resolve, 50))
    await settle()
    result.serverNodes = before.length
    result.retainedServerNodes = before.filter(node => target.contains(node)).length
    assert.equal(result.retainedServerNodes, result.serverNodes, 'Hydration replaced meaningful server elements')
    const click = async node => { assert.ok(node, 'Missing interaction target'); node.click(); await settle() }
    const query = selector => document.querySelector(selector)
    if (family === 'progress') {
      const advance=[...document.querySelectorAll('button')].find(node=>node.textContent==='Advance')
      for (const value of [75,85,95,100,0]) {
        advance.click(); await settle()
        assert.equal(document.querySelector('[role="status"]').textContent,`${value}%`)
        assert.equal(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),String(value))
      }
      result.interactions.push('Progress advances 65→100 and resets to 0 with matching output and ARIA')
    }
    if (family === 'pagination') {
      for (const value of [2,10,9,1]) {
        const trigger=[...document.querySelectorAll('[data-scope="pagination"][data-part="item"]')].find(node=>node.textContent===String(value))
        assert.ok(trigger); trigger.click(); await settle()
        assert.match(document.querySelector('[role="status"]').textContent,new RegExp(`Page ${value} of 10`))
      }
      result.interactions.push('Pagination 1→2→10→9→1 updates output')
    }
    if (family === 'clipboard') {
      let copied=''
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}})
      document.querySelector('button').click(); await settle()
      assert.equal(copied,'https://destyler.org')
      assert.equal(document.querySelector('[role="status"]').textContent,'Copied')
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('permission denied')}}})
      document.querySelector('button').click(); await settle()
      assert.match(document.querySelector('[role="status"]').textContent,/Copy unavailable/)
      result.interactions.push('Clipboard reports resolved success and rejected failure honestly (mock API)')
    }
    if (family === 'splitter') {
      const handle = query('[data-scope="splitter"][data-part="resize-trigger"]')
      assert.equal(handle.getAttribute('aria-label'), 'Resize A and B panels')
      assert.equal(handle.getAttribute('role'), 'separator')
      assert.equal(handle.tabIndex, 0)
      result.interactions.push('focusable resize separator has accessible name')
    }
    if (family === 'toggle') {
      const toggle = query('[data-scope="toggle"][data-part="root"]')
      assert.equal(toggle.getAttribute('aria-label'), 'Toggle', 'Toggle needs an accessible name')
      const initial = toggle.getAttribute('aria-pressed')
      await click(toggle)
      assert.notEqual(toggle.getAttribute('aria-pressed'), initial)
      await click(toggle)
      assert.equal(toggle.getAttribute('aria-pressed'), initial)
      result.interactions.push('named Toggle on and off')
    }
    if (family === 'scroll-area') {
      const thumbs = [...document.querySelectorAll('[data-scope="scroll-area"][data-part="thumb"]')]
      assert.equal(thumbs.length, 2)
      assert.deepEqual(thumbs.map(node => node.dataset.orientation), ['vertical', 'horizontal'])
      assert.equal(new Set(thumbs.map(node => node.id)).size, 2, 'Scroll thumbs need distinct orientation IDs')
      result.interactions.push('vertical/horizontal thumb orientations and unique IDs')
    }
    if (family === 'calendar') {
      const tables = [...document.querySelectorAll('[data-scope="calendar"][data-part="table"]')]
      assert.equal(tables.length,1)
      assert.equal(tables[0].dataset.view,'day')
      const month=query('select[aria-label="Choose the Month"]')
      const year=query('select[aria-label="Choose the Year"]')
      assert.equal(month.value,'11'); assert.equal(year.value,'2026')
      await click(query('[data-scope="calendar"][data-part="next-trigger"]')); assert.equal(month.value,'12')
      await click(query('[data-scope="calendar"][data-part="prev-trigger"]')); assert.equal(month.value,'11')
      year.value='2027'; year.dispatchEvent(new window.Event('change',{bubbles:true})); await settle()
      assert.ok(query('[data-scope="calendar"][data-part="table-cell-trigger"][data-value="2027-11-15"]'))
      month.value='10'; month.dispatchEvent(new window.Event('change',{bubbles:true})); await settle()
      await click(query('[data-scope="calendar"][data-part="table-cell-trigger"][data-value="2027-10-15"]'))
      assert.match(query('[role="status"]').textContent,/Selected: 2027-10-15/)
      await (await import('../../../scripts/lib/calendar-outside-selection.mjs')).verifyOutsideSelection(document, settle)
      result.interactions.push('inline month navigation, year/month state updates, date and outside-day selection')
    }
    if (family === 'checkbox' || family === 'switch') {
      const input = query(`input[type="checkbox"]`)
      const initial = input.checked
      await click(query(`[data-scope="${family}"][data-part="control"]`))
      assert.equal(input.checked, !initial)
      await click(query(`[data-scope="${family}"][data-part="control"]`))
      assert.equal(input.checked, initial)
      result.interactions.push('toggle on and off')
    }
    if (family === 'dialog') {
      for (let i = 0; i < 2; i++) {
        await click(query('[data-scope="dialog"][data-part="trigger"]'))
        assert.equal(query('[data-scope="dialog"][data-part="content"]').dataset.state, 'open')
        await click(query('[data-scope="dialog"][data-part="close-trigger"]'))
        assert.ok(!query('[data-scope="dialog"][data-part="content"][data-state="open"]'))
      }
      result.interactions.push('open and close twice')
    }
    if (family === 'tabs') {
      const triggers = [...document.querySelectorAll('[data-scope="tabs"][data-part="trigger"]')]
      for (const index of [1, 0, 1, 0]) {
        await click(triggers[index])
        assert.equal(triggers[index].getAttribute('aria-selected'), 'true')
      }
      result.interactions.push('switch between tabs twice')
    }
    if (family === 'select') {
      for (let i = 0; i < 2; i++) {
        await click(query('[data-scope="select"][data-part="trigger"]'))
        const items = [...document.querySelectorAll('[data-scope="select"][data-part="item"]')]
        assert.ok(items.length > 1)
        await click(items[i])
        assert.ok(query('[data-scope="select"][data-part="value-text"]').textContent.includes(['React', 'Solid'][i]))
        assert.ok(query('[role="status"]').textContent.includes(['react','solid'][i]))
      }
      result.interactions.push('select two choices with current status')
    }
    if (family === 'steps') {
      const current = () => query('[data-scope="steps"][data-part="trigger"][aria-selected="true"]')?.id
      const original = current()
      for (let i = 0; i < 2; i++) {
        await click(query('[data-scope="steps"][data-part="next-trigger"]'))
        assert.notEqual(current(), original)
        await click(query('[data-scope="steps"][data-part="prev-trigger"]'))
        assert.equal(current(), original)
      }
      result.interactions.push('next and previous twice')
    }
    await settle()
    const ssr = JSON.parse(await readFile(join(out, `${family}-ssr.json`), 'utf8'))
    result.htmlBytes = ssr.htmlBytes
    assert.deepEqual(ssr.errors, [], 'SSR errors')
    assert.deepEqual(ssr.warnings, [], 'SSR warnings')
    assert.deepEqual(result.errors, [], 'Client runtime errors')
    assert.deepEqual(result.warnings, [], 'Client runtime warnings')
    result.pass = true
  }
} catch (error) {
  result.error = error.stack || String(error)
} finally {
  try { dispose?.() } catch (error) { result.errors.push(String(error)); result.pass = false }
  if (win) await win.happyDOM.abort()
  if (mode === 'hydrate') await writeFile(join(out, `${family}.json`), JSON.stringify(result, null, 2) + '\n')
  if (mode === 'ssr' && result.error) process.stdout.write(result.error + '\n')
  process.exit(mode === 'ssr' ? result.error ? 1 : 0 : result.pass ? 0 : 1)
}
