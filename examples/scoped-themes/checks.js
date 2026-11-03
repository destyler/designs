import { themeTokens } from '../../src/portal-theme.js'

const run = document.querySelector('#run-checks')
const summary = document.querySelector('#check-summary')
const results = document.querySelector('#check-results')
const pause = () => new Promise(resolve => setTimeout(resolve, 50))
function assert(condition, message) { if (!condition) throw new Error(message) }

run.addEventListener('click', async () => {
  run.disabled = true
  results.replaceChildren()
  document.querySelector('details').open = true
  summary.textContent = 'Running…'
  summary.dataset.status = 'running'
  let passed = 0, failed = 0
  const check = async (name, callback) => {
    const item = document.createElement('li')
    try { await callback(); passed++; item.dataset.status = 'passed'; item.textContent = `PASS · ${name}` }
    catch (error) { failed++; item.dataset.status = 'failed'; item.textContent = `FAIL · ${name}: ${error.message}` }
    results.append(item)
  }
  let frame
  try {
    frame = document.createElement('iframe')
    frame.title = 'Isolated theme playground under test'
    const loaded = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Example did not load within 10 seconds')), 10000)
      frame.addEventListener('load', () => { clearTimeout(timeout); resolve() }, { once: true })
      frame.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Example failed to load')) }, { once: true })
    })
    frame.src = './index.html'
    document.querySelector('#frame-container').replaceChildren(frame)
    await loaded
    const doc = frame.contentDocument
    const win = frame.contentWindow
    const css = element => win.getComputedStyle(element)
    const token = (element, name) => css(element).getPropertyValue(name).trim()
    const card = doc.querySelector('#card-neutral-light')
    const source = card.querySelector('[data-theme-root]')
    const other = doc.querySelector('#source-ember-light')
    const dialog = doc.querySelector('#theme-dialog')
    const click = (container, action) => container.querySelector(`[data-action="${action}"]`).click()
    const equalTokens = () => themeTokens.every(name => token(source, name) === token(dialog, name))
    await check('Example module initializes all four cards', () => {
      assert(doc.documentElement.dataset.playgroundReady === 'true', 'Module did not finish')
      assert(doc.querySelectorAll('.lab-card').length === 4, 'Expected four cards')
    })
    await check('Browser supports the CSS scope and native modal contract', () => {
      assert('CSSScopeRule' in win, 'CSS @scope is unavailable')
      assert(typeof dialog.showModal === 'function', 'showModal is unavailable')
    })
    await check('All four skin/mode combinations resolve distinct backgrounds', () => {
      const backgrounds = [...doc.querySelectorAll('.preview')].map(root => css(root).backgroundColor)
      assert(new Set(backgrounds).size === 4, `Expected four backgrounds, got ${backgrounds.join(', ')}`)
      assert(backgrounds.every(value => value !== 'rgba(0, 0, 0, 0)'), 'A root is transparent')
    })
    await check('Scoped checkbox and button styles actually apply', () => {
      assert(Math.abs(parseFloat(css(source.querySelector('input')).width) - 19.2) < 1, 'Checkbox dimensions were not themed')
      assert(css(source.querySelector('[data-action="open"]')).backgroundColor === 'rgb(36, 78, 216)', 'Button accent is not Neutral blue')
    })
    const baseline = doc.querySelector('#baseline-button')
    const baselineStyle = [css(baseline).backgroundColor, css(baseline).borderRadius, css(doc.querySelector('#baseline-checkbox')).width]
    await check('Un-themed hooks match unhooked native controls', () => {
      const plainButton = doc.createElement('button')
      plainButton.textContent = 'Plain native button'
      const plainInput = doc.createElement('input')
      plainInput.type = 'checkbox'
      doc.querySelector('.baseline').append(plainButton, plainInput)
      try {
        assert(css(baseline).backgroundColor === css(plainButton).backgroundColor, 'Button background leaked outside a root')
        assert(css(baseline).borderRadius === css(plainButton).borderRadius, 'Button radius leaked outside a root')
        assert(css(doc.querySelector('#baseline-checkbox')).width === css(plainInput).width, 'Checkbox dimensions leaked outside a root')
        assert(css(doc.querySelector('#baseline-checkbox')).accentColor === css(plainInput).accentColor, 'Checkbox accent leaked outside a root')
      } finally { plainButton.remove(); plainInput.remove() }
    })
    await check('Changing one root leaves other roots and the baseline unchanged', () => {
      const oldOther = themeTokens.map(name => token(other, name))
      click(card, 'mode')
      assert(source.dataset.theme === 'dark', 'Source did not switch to dark')
      assert(themeTokens.every((name, i) => token(other, name) === oldOther[i]), 'Neighbour tokens changed')
      assert(JSON.stringify(baselineStyle) === JSON.stringify([css(baseline).backgroundColor, css(baseline).borderRadius, css(doc.querySelector('#baseline-checkbox')).width]), 'Un-themed baseline changed')
    })
    await check('Local override can be applied, adapted to dark mode, and removed', () => {
      click(card, 'override')
      assert(token(source, '--ds-accent') === '#9de3c0', 'Dark override missing')
      click(card, 'mode')
      assert(token(source, '--ds-accent') === '#19734a', 'Light override missing')
      click(card, 'override')
      assert(token(source, '--ds-accent') === '#244ed8', 'Default accent was not restored')
    })
    await check('Changing skin changes typography and radius without changing mode', () => {
      click(card, 'skin')
      assert(source.dataset.skin === 'ember' && source.dataset.theme === 'light', 'Wrong skin/mode')
      assert(token(source, '--ds-radius') === '18px', 'Ember radius missing')
      assert(css(source).fontFamily.includes('Georgia'), 'Ember typography missing')
      click(card, 'skin')
    })
    await check('Native checkbox interaction changes only the selected card', () => {
      const input = source.querySelector('input')
      input.click()
      assert(!input.checked && other.querySelector('input').checked, 'Checkbox state leaked')
    })
    await check('Tabs switch panels and keep roving tabindex consistent', () => {
      const tabs = [...source.querySelectorAll('[role="tab"]')]
      tabs[1].click()
      assert(tabs[1].tabIndex === 0 && tabs[0].tabIndex === -1, 'Incorrect tabindex')
      assert(!doc.getElementById(tabs[1].getAttribute('aria-controls')).hidden, 'Activity panel still hidden')
      assert(doc.getElementById(tabs[0].getAttribute('aria-controls')).hidden, 'Overview panel still visible')
    })
    await check('Arrow navigation wraps and skips disabled tabs', () => {
      const tabs = [...source.querySelectorAll('[role="tab"]')]
      tabs[1].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
      assert(tabs[0].getAttribute('aria-selected') === 'true', 'Did not wrap to Overview')
      tabs[0].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
      assert(tabs[1].getAttribute('aria-selected') === 'true' && tabs[2].getAttribute('aria-selected') === 'false', 'Disabled tab selected')
    })
    await check('Home and End select the first and last enabled tabs', () => {
      const tabs = [...source.querySelectorAll('[role="tab"]')]
      tabs[1].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
      assert(tabs[0].getAttribute('aria-selected') === 'true', 'Home failed')
      tabs[0].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'End', bubbles: true }))
      assert(tabs[1].getAttribute('aria-selected') === 'true', 'End failed')
    })
    await check('Per-card reset restores tokens, tabs, and checkboxes', () => {
      click(card, 'reset')
      assert(source.dataset.theme === 'light' && source.dataset.skin === 'neutral', 'Theme reset failed')
      assert(source.querySelector('input').checked, 'Checkbox reset failed')
      assert(source.querySelector('[role="tab"]').getAttribute('aria-selected') === 'true', 'Tabs reset failed')
    })
    await check('Nested roots keep independent tokens and rendered checkbox accents', () => {
      const parent = doc.querySelector('#nested-parent'), child = doc.querySelector('#nested-child')
      assert(token(parent, '--ds-accent') === '#ffb38c' && token(child, '--ds-accent') === '#244ed8', 'Nested tokens leaked')
      assert(css(child.querySelector('input')).accentColor === 'rgb(36, 78, 216)', 'Nested checkbox accent is incorrect')
    })
    await check('Dialog is a detached body child and enters native modal state', () => {
      click(card, 'open')
      assert(dialog.parentElement === doc.body && !source.contains(dialog), 'Dialog is not detached')
      assert(dialog.open && dialog.matches(':modal'), 'Dialog is not modal')
    })
    await check('All nine computed source tokens reach the dialog', () => {
      assert(equalTokens(), 'Source and portal tokens differ')
      assert(doc.querySelector('#portal-sync').textContent === '9 / 9 tokens match', 'Inspector disagrees')
    })
    await check('Switching mode inside the open dialog updates both roots', () => {
      click(dialog, 'mode')
      assert(source.dataset.theme === 'dark' && dialog.dataset.theme === 'dark' && equalTokens(), 'Open portal did not update')
    })
    await check('Local accent override propagates while the dialog is open', () => {
      click(dialog, 'override')
      assert(token(dialog, '--ds-accent') === '#9de3c0' && equalTokens(), 'Local override did not propagate')
    })
    await check('Close restores portal attributes, inline tokens, and trigger focus', async () => {
      click(dialog, 'close')
      await pause()
      assert(!dialog.open && !dialog.hasAttribute('data-theme-root'), 'Portal was not disposed')
      assert(themeTokens.every(name => !dialog.style.getPropertyValue(name)), 'Inline tokens remain')
      assert(doc.activeElement === card.querySelector('[data-action="open"]'), 'Trigger focus was not restored')
    })
    await check('Reopening from another card switches ownership without stale tokens', async () => {
      const next = doc.querySelector('#card-ember-light')
      click(next, 'open')
      assert(dialog.dataset.skin === 'ember' && dialog.dataset.theme === 'light', 'Stale portal theme')
      assert(themeTokens.every(name => token(other, name) === token(dialog, name)), 'Wrong owner tokens')
      click(dialog, 'close')
      await pause()
    })
    await check('Repeated open and immediate close/reopen retain a live binding', async () => {
      click(card, 'open'); click(card, 'open')
      dialog.close(); click(card, 'open')
      await pause()
      assert(dialog.open && equalTokens(), 'Queued close disposed the reopened portal')
      click(dialog, 'mode')
      assert(equalTokens(), 'Reopened binding stopped updating')
      dialog.close()
      await pause()
    })
    await check('Reset all restores all four initial configurations', () => {
      doc.querySelector('#reset-all').click()
      for (const root of doc.querySelectorAll('.preview')) {
        assert(root.id === `source-${root.dataset.skin}-${root.dataset.theme}`, 'Initial configuration not restored')
        assert(!root.style.getPropertyValue('--ds-accent'), 'Local override remains')
      }
    })
    await check('Generated IDs are unique and all ARIA references resolve', () => {
      const ids = [...doc.querySelectorAll('[id]')].map(item => item.id)
      assert(ids.length === new Set(ids).size, 'Duplicate ID')
      for (const item of doc.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')) {
        for (const name of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
          for (const id of (item.getAttribute(name) || '').split(/\s+/).filter(Boolean)) assert(doc.getElementById(id), `Missing ${id}`)
        }
      }
    })
  } catch (error) {
    await check('Load the example', () => { throw error })
  } finally {
    // Leave a clean fixture for manual inspection, including after failed tests.
    const doc = frame?.contentDocument
    const dialog = doc?.querySelector('#theme-dialog')
    if (typeof dialog?.close === 'function') dialog.close()
    doc?.querySelector('#reset-all')?.click()
    summary.textContent = `${passed} passed · ${failed} failed. Browser: ${navigator.userAgent}`
    summary.dataset.status = failed ? 'failed' : 'passed'
    run.disabled = false
  }
})
