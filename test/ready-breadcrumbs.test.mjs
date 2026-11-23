import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) {
    if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
    }
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const { run } = await import(pathToFileURL(process.argv[3]))
  const settle = () => new Promise(resolve => setTimeout(resolve, 65))
  for (const linkedCurrent of [false, true]) {
    const target = document.createElement('div')
    document.body.append(target)
    const clicks = []
    const items = [
      { label: 'Home', href: './?view=all#home' },
      { label: 'Settings', href: '#settings' },
      { label: 'Teams', ...(linkedCurrent ? { href: '#teams' } : {}) },
    ]
    const dispose = run(target, { items, label: 'Your location', separator: '›', onNavigate(event, item) {
      clicks.push([item.href, event.ctrlKey])
      if (!event.ctrlKey) event.preventDefault()
    } })
    await settle()
    const nav = target.querySelector('nav[data-scope=breadcrumbs]')
    assert.equal(nav.getAttribute('aria-label'), 'Your location')
    assert.equal(nav.querySelectorAll('ol > li').length, 3)
    const separators = [...nav.querySelectorAll('[data-part=separator]')]
    assert.equal(separators.length, 2)
    for (const separator of separators) {
      assert.equal(separator.tagName, 'SPAN')
      assert.equal(separator.textContent, '›')
      assert.equal(separator.getAttribute('aria-hidden'), 'true')
      assert.equal(separator.tabIndex, -1)
    }
    const links = [...nav.querySelectorAll('a[href]')]
    assert.deepEqual(links.map(el => el.getAttribute('href')), items.filter(item => item.href).map(item => item.href))
    const current = [...nav.querySelectorAll('[aria-current]')]
    assert.equal(current.length, 1)
    assert.equal(current[0].getAttribute('aria-current'), 'page')
    assert.equal(current[0].textContent.trim(), 'Teams')
    assert.equal(current[0].hasAttribute('href'), linkedCurrent)
    const fire = (anchor, ctrlKey) => anchor.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey }))
    assert.equal(fire(links[0], false), false, 'application can intercept a genuine native anchor event')
    assert.equal(fire(links[1], true), true, 'modified click not intercepted by the wrapper')
    if (!linkedCurrent) assert.equal(fire(current[0], false), true, 'non-link current item does not navigate')
    assert.deepEqual(clicks, [['./?view=all#home', false], ['#settings', true]])
    await dispose()
    target.remove()
  }
  await win.happyDOM.close()
  console.log('PASS Ready Breadcrumbs')
} else {
  test('Ready Breadcrumbs requires ancestor links and rejects executable schemes without rewriting native hrefs', async () => {
    const { prepareBreadcrumbs } = await import('../packages/ready/Breadcrumbs.ts')
    assert.deepEqual(prepareBreadcrumbs([]), [])
    assert.throws(() => prepareBreadcrumbs([{ label: 'Home' }, { label: 'Current' }]), /require an href/)
    assert.throws(() => prepareBreadcrumbs([{ label: ' ' }]), /item labels/)
    assert.throws(() => prepareBreadcrumbs([{ label: 'No', href: 'JaVa\nScRiPt:1' }]), /executable/)
    assert.equal(prepareBreadcrumbs([{ label: 'Current', href: '../relative?x=y#part' }])[0].href, '../relative?x=y#part')
  })
  for (const framework of ['react', 'solid', 'vue', 'svelte']) test(`Ready ${framework} Breadcrumbs: native navigation, current page and decorative separators`, { timeout: 120000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-breadcrumbs-'))
    try {
      const source = `${root}packages/ready/${framework}/Breadcrumbs.${{ react: 'tsx', solid: 'tsx', vue: 'vue', svelte: 'svelte' }[framework]}`
      let plugin, code
      if (framework === 'react') {
        plugin = (await import('@vitejs/plugin-react')).default()
        code = `import {createElement as h} from 'react';import {createRoot} from 'react-dom/client';import {Breadcrumbs} from '${source}';export function run(target, props){const root=createRoot(target);root.render(h(Breadcrumbs,props));return()=>root.unmount()}`
      } else if (framework === 'solid') {
        plugin = (await import('vite-plugin-solid')).default()
        code = `import {render} from 'solid-js/web';import {Breadcrumbs} from '${source}';export function run(target,props){return render(()=><Breadcrumbs {...props}/>,target)}`
      } else if (framework === 'vue') {
        plugin = (await import('@vitejs/plugin-vue')).default()
        code = `import {createApp,h} from 'vue';import Breadcrumbs from '${source}';export function run(target,props){const app=createApp({render:()=>h(Breadcrumbs,props)});app.mount(target);return()=>app.unmount()}`
      } else {
        plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false })
        code = `import {mount,unmount} from 'svelte';import Breadcrumbs from '${source}';export function run(target,props){const app=mount(Breadcrumbs,{target,props});return()=>unmount(app)}`
      }
      const entry = join(folder, 'entry.tsx')
      await writeFile(entry, code)
      const { build } = await import('vite')
      await build({ root, configFile: false, logLevel: 'error', plugins: [plugin], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'client.mjs' } } })
      assert.match(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/client.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 }), /PASS Ready Breadcrumbs/)
    } finally { await rm(folder, { recursive: true, force: true }) }
  })
}
