import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')
const markup = (orientation, change) => `
  <form><button type="button" id="before" ${change}>Change orientation</button>
    <Separator tabindex="0"/><Separator ${orientation}/>
    <button type="button" id="after">After</button></form>`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Separator} from '${ready}/react/Separator';
    function App(){const [orientation,setOrientation]=useState('vertical');return (${markup('orientation={orientation}',"onClick={()=>setOrientation('horizontal')}")})}
    createRoot(document.getElementById('app')).render(<App/>);`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {Separator} from '${ready}/solid/Separator';
    function App(){const [orientation,setOrientation]=createSignal('vertical');return (${markup('orientation={orientation()}',"onClick={()=>setOrientation('horizontal')}")})}
    render(()=> <App/>,document.getElementById('app'));`,
  vue: `<script setup>import {ref} from 'vue';import Separator from '${ready}/vue/Separator.vue';
    const orientation=ref('vertical');</script><template>${markup(':orientation="orientation"',`@click="orientation='horizontal'"`)}</template>`,
  svelte: `<script>import Separator from '${ready}/svelte/Separator.svelte';
    let orientation=$state('vertical');</script>${markup('{orientation}',"onclick={()=>orientation='horizontal'}")}`,
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window()
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  await import(pathToFileURL(process.argv[3]))
  const eventually = async (read) => {
    for (let i = 0; i < 80; i++) {
      try { return read() } catch (error) {
        if (i === 79) throw error
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
  }
  const [horizontal, vertical] = await eventually(() => {
    const nodes = [...document.querySelectorAll('[role=separator]')]
    assert.equal(nodes.length, 2, document.body.innerHTML)
    return nodes
  })
  for (const [node, orientation] of [[horizontal,'horizontal'],[vertical,'vertical']]) {
    assert.equal(node.tagName, 'DIV')
    assert.equal(node.dataset.scope, 'separator')
    assert.equal(node.dataset.part, 'root')
    assert.equal(node.dataset.orientation, orientation)
    assert.equal(node.getAttribute('aria-orientation'), orientation)
    assert.ok(node.classList.contains('rd-component'))
    assert.equal(node.hasAttribute('tabindex'), false, 'Does not accept an unsupported focus override')
    assert.equal(node.hasAttribute('contenteditable'), false)
    assert.equal(node.childElementCount, 0)
  }
  assert.ok(horizontal.id && vertical.id)
  assert.notEqual(horizontal.id, vertical.id)
  const before = document.getElementById('before')
  const after = document.getElementById('after')
  before.focus()
  before.click()
  await eventually(() => assert.equal(vertical.getAttribute('aria-orientation'), 'horizontal'))
  assert.equal(vertical.dataset.orientation, 'horizontal')
  assert.equal(document.querySelectorAll('[role=separator]')[1], vertical)
  assert.equal(document.activeElement, before, 'Reactive orientation change does not steal focus')
  after.focus()
  assert.equal(document.activeElement, after)
  await dom.happyDOM.close()
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Separator is passive and reactively exposes orientation in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-separator-'))
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
        await build({ root, configFile:false, logLevel:'error', plugins:[plugin], build:{ outDir:join(dir,'out'), lib:{ entry, formats:['es'], fileName:()=> 'separator.mjs' }, rollupOptions:{output:{inlineDynamicImports:true}} } })
        const bundle = join(dir,'out/separator.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle], { timeout:12000, stdio:'inherit' })
        if (process.env.READY_CHROMIUM_PATH) {
          const { chromium } = await import('playwright')
          const browser = await chromium.launch({executablePath:process.env.READY_CHROMIUM_PATH})
          try {
            const page = await browser.newPage()
            const errors = []
            page.on('pageerror', error => errors.push(error.message))
            await page.setContent('<main id="app"></main>')
            await page.addScriptTag({type:'module',content:await readFile(bundle,'utf8')})
            await page.getByRole('separator').last().waitFor({state:'attached'})
            await page.locator('#before').focus()
            await page.keyboard.press('Enter')
            await page.waitForFunction(() => document.querySelectorAll('[role=separator]')[1]?.getAttribute('aria-orientation')==='horizontal')
            assert.equal(await page.evaluate(() => document.activeElement.id), 'before')
            await page.keyboard.press('Tab')
            assert.equal(await page.evaluate(() => document.activeElement.id), 'after')
            assert.deepEqual(errors, [])
          } finally { await browser.close() }
        }
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
