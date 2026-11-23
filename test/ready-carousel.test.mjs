import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const waitFor = async (fn, message) => {
  for (let i = 0; i < 40; i++) {
    if (fn()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.ok(fn(), message)
}

if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (/^(window|document|navigator|HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|FormData)$/.test(key)) {
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] })
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  // Happy DOM does not lay out a grid. Supply a deterministic 320px-per-slide
  // geometry to the real primitive's CSS snap-measurement code.
  const width = 320
  const isGroup = node => node.dataset.part === 'item-group'
  const isSlide = node => node.dataset.scope === 'carousel' && node.dataset.part === 'item'
  Object.defineProperties(win.HTMLElement.prototype, {
    offsetWidth: { configurable: true, get() { return isGroup(this) ? width : 0 } },
    scrollWidth: { configurable: true, get() { return isGroup(this) ? this.children.length * width : 0 } },
  })
  // The primitive publishes a snap-page on scrollend only when it has seen an
  // intersection. Report the first slide at startup; the test drives scroll.
  win.IntersectionObserver = class {
    constructor(callback) { this.callback = callback }
    observe(target) {
      if (target.dataset.index === '0') queueMicrotask(() => this.callback([{ target, isIntersecting: true }]))
    }
    disconnect() {}
  }
  const originalRect = win.HTMLElement.prototype.getBoundingClientRect
  win.HTMLElement.prototype.getBoundingClientRect = function () {
    if (isGroup(this)) return new win.DOMRect(0, 0, width, 200)
    if (isSlide(this)) return new win.DOMRect(Number(this.dataset.index) * width - this.parentElement.scrollLeft, 0, width, 200)
    return originalRect.call(this)
  }
  document.head.innerHTML = '<style>.rd-carousel [data-part=item-group]{scroll-padding-left:0px;scroll-padding-right:0px;scroll-padding-top:0px;scroll-padding-bottom:0px}</style>'
  document.body.innerHTML = '<div id="app"></div>'
  await import(pathToFileURL(process.argv[3]))
  const carousel = label => document.querySelector(`[role=region][aria-label="${label}"]`)
  const region = () => carousel('Stories')
  const parts = part => [...region().querySelectorAll(`[data-part="${part}"]`)]
  const trigger = direction => parts(`${direction}-trigger`)[0]
  const indicator = page => parts('indicator')[page]
  const pageOutput = () => document.querySelector('[data-pages]').textContent
  const assertPage = page => {
    const slides = parts('item')
    assert.equal(slides.length, 3)
    slides.forEach((slide, index) => {
      assert.equal(slide.getAttribute('aria-hidden'), String(index !== page))
      assert.equal(slide.hasAttribute('inert'), index !== page)
      assert.equal(indicator(index).tabIndex, index === page ? 0 : -1)
      assert.equal(indicator(index).getAttribute('aria-current'), index === page ? 'true' : null)
    })
  }
  await waitFor(() => region() && trigger('next').getAttribute('aria-disabled') === 'false', 'ready after mount')
  assert.equal(region().getAttribute('aria-roledescription'), 'carousel')
  assert.equal(parts('item')[0].getAttribute('aria-label'), 'First (1 of 3)')
  assert.equal(parts('item')[1].querySelector('a').textContent.trim(), 'Second story')
  assert.equal(parts('item-group')[0].getAttribute('aria-live'), 'off')
  assert.equal(parts('autoplay-trigger').length, 0)
  assert.equal(carousel('Empty'), null)
  assert.equal(carousel('Single').querySelector('button'), null)
  assert.equal(carousel('Single').querySelector('[data-part=item]').textContent.trim(), 'First story')
  assert.equal(trigger('prev').getAttribute('aria-disabled'), 'true')
  assert.equal(trigger('prev').getAttribute('aria-controls'), parts('item-group')[0].id)
  assertPage(0)
  assert.equal(pageOutput(), '')
  trigger('prev').click()
  assertPage(0)
  assert.equal(pageOutput(), '')
  trigger('next').focus()
  trigger('next').click()
  await waitFor(() => pageOutput() === '1' && indicator(1).tabIndex === 0, 'moves to second slide')
  assertPage(1)
  assert.equal(document.activeElement, trigger('next'))
  trigger('next').click()
  await waitFor(() => pageOutput() === '12' && indicator(2).tabIndex === 0, 'moves to last slide')
  assertPage(2)
  assert.equal(trigger('next').disabled, false)
  assert.equal(trigger('next').getAttribute('aria-disabled'), 'true')
  assert.equal(document.activeElement, trigger('next'))
  trigger('next').click()
  assert.equal(pageOutput(), '12')
  indicator(2).focus()
  const press = (index, key) => indicator(index).dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  press(2, 'ArrowLeft')
  await waitFor(() => pageOutput() === '121' && document.activeElement === indicator(1), 'arrow moves page and focus')
  assertPage(1)
  press(1, 'Home')
  await waitFor(() => pageOutput() === '1210' && document.activeElement === indicator(0), 'Home moves to first page')
  press(0, 'End')
  await waitFor(() => pageOutput() === '12102' && document.activeElement === indicator(2), 'End moves to last page')
  indicator(0).click()
  await waitFor(() => pageOutput() === '121020' && document.activeElement === indicator(0), 'indicator pointer activation')
  assertPage(0)
  const viewport = parts('item-group')[0]
  assert.equal(viewport.scrollLeft, 0)
  const outgoingLink = parts('item')[0].querySelector('a')
  outgoingLink.focus()
  assert.equal(document.activeElement, outgoingLink)
  viewport.scrollLeft = width
  viewport.dispatchEvent(new win.Event('scroll'))
  await waitFor(() => pageOutput() === '1210201' && indicator(1).tabIndex === 0, 'scroll updates page')
  assert.equal(document.activeElement, indicator(1), 'focus leaves the now-inert outgoing slide')
  assertPage(1)
  await win.happyDOM.close()
} else {
  const plugins = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    solid: async () => (await import('vite-plugin-solid')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
  }
  for (const [name, plugin] of Object.entries(plugins)) test(`Ready Carousel ${name}: slots, native navigation, bounds, keyboard focus and callback`, { timeout: 120_000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-carousel-test-'))
    try {
      const { build } = await import('vite')
      const file = join(root, 'test/fixtures/ready-carousel', `${name}.${name === 'react' || name === 'solid' ? 'tsx' : 'ts'}`)
      await build({ root, configFile: false, logLevel: 'error', plugins: [await plugin()], build: {
        outDir: folder, minify: false, lib: { entry: file, formats: ['es'], fileName: () => 'client.mjs' },
      } })
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  })
}
