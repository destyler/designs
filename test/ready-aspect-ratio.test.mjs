import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { validateAspectRatio } from '../packages/ready/AspectRatio.ts'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')
const parts = Object.fromEntries(['root','content'].map(part => [part, `[data-scope=aspect-ratio][data-part=${part}]`]))
const app = (ratio, click) => `
  <section><button id="resize" ${click}>Change ratio</button>
    <div id="square" style="width:200px"><AspectRatio><span>Square</span></AspectRatio></div>
    <div id="resizable" style="width:320px"><AspectRatio ${ratio} tabindex="7">
      <a href="#photo" id="child">Photo details</a>
    </AspectRatio></div>
  </section>`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {AspectRatio} from '${ready}/react/AspectRatio';
    function App(){const [ratio,setRatio]=useState(16/9);return (${app('ratio={ratio}',"onClick={()=>setRatio(4/5)}").replaceAll('style="width:200px"','style={{width:200}}').replaceAll('style="width:320px"','style={{width:320}}')})}
    createRoot(document.getElementById('app')).render(<App/>);`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {AspectRatio} from '${ready}/solid/AspectRatio';
    function App(){const [ratio,setRatio]=createSignal(16/9);return (${app('ratio={ratio()}',"onClick={()=>setRatio(4/5)}")})}
    render(()=> <App/>,document.getElementById('app'));`,
  vue: `<script setup>import {ref} from 'vue';import AspectRatio from '${ready}/vue/AspectRatio.vue';
    const ratio=ref(16/9);</script><template>${app(':ratio="ratio"','@click="ratio=4/5"')}</template>`,
  svelte: `<script>import AspectRatio from '${ready}/svelte/AspectRatio.svelte';
    let ratio=$state(16/9);</script>${app('{ratio}',"onclick={()=>ratio=4/5}")}`,
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
  const [square, wide] = await eventually(() => {
    const nodes = [...document.querySelectorAll(parts.root)]
    assert.equal(nodes.length, 2, document.body.innerHTML)
    return nodes
  })
  assert.equal(square.style.paddingBottom, '100%')
  assert.equal(wide.style.paddingBottom, '56.25%')
  assert.equal(wide.style.width, '100%')
  assert.notEqual(square.id, wide.id)
  const content = wide.querySelector(parts.content)
  assert.ok(content)
  assert.equal(content.style.position, 'absolute')
  for (const node of [square, wide, content]) {
    assert.equal(node.tagName, 'DIV')
    assert.equal(node.hasAttribute('role'), false)
    assert.equal(node.hasAttribute('tabindex'), false)
    assert.equal(node.hasAttribute('aria-hidden'), false)
  }
  const child = document.getElementById('child')
  assert.equal(child.parentElement, content)
  child.focus()
  document.getElementById('resize').click()
  await eventually(() => assert.equal(wide.style.paddingBottom, '125%'))
  assert.equal(document.getElementById('child'), child)
  assert.equal(document.activeElement, child, 'Ratio updates do not remount or hide focusable children')
  await dom.happyDOM.close()
} else {
  test('Ready AspectRatio validates width divided by height, including a default square', () => {
    assert.equal(validateAspectRatio(), 1)
    for (const valid of [1 / 4, 4 / 5, 16 / 9, 3, 100]) {
      assert.equal(validateAspectRatio(valid), valid)
    }
    for (const invalid of [0, -0, -1, NaN, -Infinity, Infinity, Number.MIN_VALUE, null, '1', {}]) {
      assert.throws(() => validateAspectRatio(invalid), {name:'RangeError', message:/Ready AspectRatio: ratio/})
    }
  })

  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready AspectRatio lays out native children and reactively passes a ratio in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-aspect-ratio-'))
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
        await build({ root, configFile:false, logLevel:'error', plugins:[plugin], build:{ outDir:join(dir,'out'), lib:{ entry, formats:['es'], fileName:()=> 'aspect-ratio.mjs' }, rollupOptions:{output:{inlineDynamicImports:true}} } })
        const bundle = join(dir,'out/aspect-ratio.mjs')
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
            const assertBounds = async (container, width, height) => {
              for (const selector of Object.values(parts)) {
                await page.waitForFunction(({s,w,h}) => {
                  const rect = document.querySelector(s)?.getBoundingClientRect()
                  return rect && Math.abs(rect.width-w)<1 && Math.abs(rect.height-h)<1
                },{s:`#${container} ${selector}`,w:width,h:height})
              }
            }
            await assertBounds('square', 200, 200)
            await assertBounds('resizable', 320, 180)
            await page.locator('#resizable').evaluate(node=>{node.style.width='160px'})
            await assertBounds('resizable', 160, 90)
            await page.locator('#resize').focus()
            await page.keyboard.press('Tab')
            assert.equal(await page.evaluate(() => document.activeElement.id), 'child')
            await page.locator('#resize').evaluate(button=>button.click())
            await assertBounds('resizable', 160, 200)
            assert.equal(await page.evaluate(() => document.activeElement.id), 'child')
            assert.deepEqual(errors, [])
          } finally { await browser.close() }
        }
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
