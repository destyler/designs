import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')
const body = `
  <div><button id="outside">Outside</button>
    <p id="main"><HoverCard label="Build notes" href="#notes" title="Build logs" description="Summary only." /></p>
    <p id="second"><HoverCard label="Release notes" href="/releases" description="Changelog preview." /></p>
    <p id="notes">Full notes destination</p>
  </div>`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {HoverCard} from '${ready}/react/HoverCard';
    import { resolveHoverCard } from '${ready}/HoverCard';window.resolveHoverCard=resolveHoverCard;
    createRoot(document.getElementById('app')).render(${body});`,
  solid: `import {render} from 'solid-js/web';import {HoverCard} from '${ready}/solid/HoverCard';
    import { resolveHoverCard } from '${ready}/HoverCard';window.resolveHoverCard=resolveHoverCard;
    render(()=> (${body}),document.getElementById('app'));`,
  vue: `<script setup>import HoverCard from '${ready}/vue/HoverCard.vue';
    import { resolveHoverCard } from '${ready}/HoverCard';window.resolveHoverCard=resolveHoverCard;
    </script><template>${body}</template>`,
  svelte: `<script>import HoverCard from '${ready}/svelte/HoverCard.svelte';
    import { resolveHoverCard } from '${ready}/HoverCard';window.resolveHoverCard=resolveHoverCard;
    </script>${body}`,
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window({ url:'https://ready.test/docs' })
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|KeyboardEvent|FocusEvent|PointerEvent|MouseEvent|CSS|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  await import(pathToFileURL(process.argv[3]))
  const pause = delay => new Promise(resolve => setTimeout(resolve, delay))
  const eventually = async read => {
    for (let i = 0; i < 80; i++) {
      try { return read() } catch (error) {
        if (i === 79) throw error
        await pause(20)
      }
    }
  }
  const main = await eventually(() => {
    const node = document.querySelector('#main')
    assert.ok(node?.querySelector('[data-part="content"]'), document.body.innerHTML)
    return node
  })
  const resolve = window.resolveHoverCard
  for (const href of ['../notes?q=1#build','#notes','/releases','https://example.test/docs','mailto:dev@example.test','tel:+123']) {
    assert.equal(resolve({href,label:'Notes',description:'Preview'}).href,href)
  }
  for (const href of ['', '   ', 'javascript:alert(1)', '  java\nscript:alert(1)', 'DATA:text/plain,example', 'blob:example']) {
    assert.throws(() => resolve({href,label:'Notes',description:'Preview'}), /Ready HoverCard: .*href/)
  }
  assert.throws(() => resolve({href:'#notes',label:'  ',description:'Preview'}), /Ready HoverCard: label/)
  assert.throws(() => resolve({href:'#notes',label:'Notes',description:''}), /Ready HoverCard: description/)

  const link = main.querySelector('a')
  const second = document.querySelector('#second a')
  const card = main.querySelector('[data-scope="hover-card"][data-part="content"]')
  const outside = document.getElementById('outside')
  const isOpen = next => {
    assert.equal(card.hidden, !next)
    assert.equal(link.getAttribute('data-state'), next ? 'open' : 'closed')
  }
  const id = link.getAttribute('aria-describedby')
  const description = document.getElementById(id)
  assert.equal(link.getAttribute('href'), '#notes')
  assert.equal(link.textContent.trim(), 'Build notes')
  assert.equal(link.tabIndex, 0)
  assert.equal(link.hasAttribute('aria-expanded'), false)
  assert.equal(link.hasAttribute('aria-haspopup'), false)
  assert.equal(card.hasAttribute('role'), false)
  assert.equal(card.getAttribute('aria-hidden'), 'true')
  assert.equal(card.querySelector('a,button,input,[tabindex]'), null)
  assert.notEqual(second.getAttribute('aria-describedby'), id)
  assert.equal(description.textContent.trim(), 'Build logs. Summary only.')
  isOpen(false)
  const pointer = (node, type, pointerType='mouse', relatedTarget=null) => {
    const react = process.argv[4] === 'react'
    const eventName = (type === 'enter' ? (react ? 'pointerover' : 'pointerenter') : (react ? 'pointerout' : 'pointerleave'))
    node.dispatchEvent(new window.PointerEvent(eventName, {bubbles:react,pointerType,relatedTarget}))
  }
  const escape = node => node.dispatchEvent(new window.KeyboardEvent('keydown', {bubbles:true,cancelable:true,key:'Escape'}))

  pointer(link,'enter','touch')
  await pause(280)
  isOpen(false)
  pointer(link,'leave','touch')
  pointer(link,'enter')
  await pause(30)
  isOpen(false)
  pointer(link,'leave')
  await pause(260)
  isOpen(false)
  pointer(link,'enter')
  await eventually(() => isOpen(true))
  pointer(link,'leave')
  await pause(180)
  isOpen(true)
  pointer(card,'enter')
  await pause(340)
  isOpen(true)
  pointer(card,'leave')
  await eventually(() => isOpen(false))

  link.focus()
  await eventually(() => isOpen(true))
  assert.equal(document.activeElement,link)
  pointer(link,'enter')
  pointer(link,'leave')
  await pause(340)
  isOpen(true)
  escape(link)
  await eventually(() => isOpen(false))
  assert.equal(document.activeElement,link)
  pointer(link,'enter')
  pointer(link,'leave')
  await pause(280)
  isOpen(false)
  outside.focus()
  assert.equal(document.activeElement,outside)
  link.focus()
  await eventually(() => isOpen(true))
  outside.focus()
  await eventually(() => isOpen(false))
  assert.equal(document.activeElement,outside)

  pointer(link,'enter')
  await eventually(() => isOpen(true))
  await pause(100) // The UI dismiss layer installs on the next frame.
  pointer(link,'leave')
  assert.equal(escape(outside),false,'Escape is handled while still in the closing grace period')
  await eventually(() => isOpen(false))
  assert.equal(document.activeElement,outside)
  pointer(link,'enter')
  await eventually(() => isOpen(true))
  await pause(100)
  assert.equal(escape(outside),false,'Escape dismisses pointer-open cards even with focus outside')
  await eventually(() => isOpen(false))
  await pause(270)
  isOpen(false)
  pointer(link,'leave')
  assert.equal(link.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})),true)
  assert.equal(document.getElementById(id),description)
  await dom.happyDOM.close()
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready HoverCard preserves native links and hover/focus/Escape in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-hover-card-'))
      try {
        let entry = join(dir, 'entry.tsx')
        let source = fixture
        let plugin
        if (framework === 'react') plugin = (await import('@vitejs/plugin-react')).default()
        if (framework === 'solid') plugin = (await import('vite-plugin-solid')).default()
        if (framework === 'vue' || framework === 'svelte') {
          await writeFile(join(dir, `Fixture.${framework}`), fixture)
          entry = join(dir, 'entry.js')
          if (framework === 'vue') {
            plugin = (await import('@vitejs/plugin-vue')).default()
            source = "import {createApp} from 'vue';import App from './Fixture.vue';createApp(App).mount('#app')"
          } else {
            plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
            source = "import {mount} from 'svelte';import App from './Fixture.svelte';mount(App,{target:document.getElementById('app')})"
          }
        }
        await writeFile(entry, source)
        await build({ root, configFile:false, logLevel:'error', plugins:[plugin], build:{ outDir:join(dir,'out'), lib:{ entry, formats:['es'], fileName:()=> 'hover-card.mjs' }, rollupOptions:{output:{inlineDynamicImports:true}} } })
        const bundle = join(dir,'out/hover-card.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle, framework], { timeout:12000, stdio:'inherit' })
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
