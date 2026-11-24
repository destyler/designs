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
const steps = [
  {id:'initial',title:'Orientation',description:'Find your way around.'},
  {id:'final',title:'Ready to start',description:'See what is available.'},
]
const body = (mainSteps, singleSteps, handler, singleHandler) => `
  <form><button id="outside" type="button">Outside</button>
    <section id="main"><Tour label="Start tour" ${mainSteps} ${handler} /></section>
    <section id="single"><Tour label="Start one-step tour" ${singleSteps} ${singleHandler} /></section>
  </form>`
const shared = `import {prepareTour} from '${ready}/Tour';window.prepareTour=prepareTour;
 const steps=${JSON.stringify(steps)};const single=[steps[0]];const record=window.record;
 const recordSingle=value=>record('single:'+value);`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {Tour} from '${ready}/react/Tour';${shared}
    createRoot(document.getElementById('app')).render(${body('steps={steps}', 'steps={single}', 'onEnd={record}', 'onEnd={recordSingle}')});`,
  solid: `import {render} from 'solid-js/web';import {Tour} from '${ready}/solid/Tour';${shared}
    render(()=> (${body('steps={steps}', 'steps={single}', 'onEnd={record}', 'onEnd={recordSingle}')}),document.getElementById('app'));`,
  vue: `<script setup>import Tour from '${ready}/vue/Tour.vue';${shared}</script>
    <template>${body(':steps="steps"', ':steps="single"', '@end="record"', '@end="recordSingle"')}</template>`,
  svelte: `<script>import Tour from '${ready}/svelte/Tour.svelte';${shared}</script>
    ${body('{steps}', 'steps={single}', 'onEnd={record}', 'onEnd={recordSingle}')}`,
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window()
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|KeyboardEvent|FocusEvent|MouseEvent|PointerEvent|CSS|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  const outcomes = []
  window.record = outcome => outcomes.push(outcome)
  await import(pathToFileURL(process.argv[3]))
  let submits = 0
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
    assert.ok(node?.querySelector('dialog'), document.body.innerHTML)
    return node
  })
  for (const value of [[], [steps[0],steps[0]], [{...steps[0],id:'bad id'}], [{...steps[0],description:' '}]]) {
    assert.throws(() => window.prepareTour(value), /Ready Tour:/)
  }
  document.querySelector('form').addEventListener('submit', event => { event.preventDefault(); submits++ })
  const dialog = main.querySelector('dialog')
  const start = main.querySelector('.rd-tour-start')
  const other = document.querySelector('#single dialog')
  const otherStart = document.querySelector('#single .rd-tour-start')
  const outside = document.querySelector('#outside')
  const action = label => [...dialog.querySelectorAll('button')].find(button => button.textContent.trim() === label)
  const shown = async text => eventually(() => {
    assert.equal(dialog.open,true)
    assert.equal(dialog.dataset.state,'open')
    assert.equal(dialog.querySelector('[data-part="title"]').textContent,text)
  })
  const ended = async expected => eventually(() => {
    assert.deepEqual(outcomes,expected)
    assert.equal(dialog.open,false)
    assert.equal(dialog.dataset.state,'closed')
    assert.equal(document.activeElement,start)
  })
  async function begin() {
    start.focus()
    start.click()
    await shown('Orientation')
  }
  async function next() {
    action('Next').focus()
    action('Next').click()
    await shown('Ready to start')
  }
  assert.notEqual(dialog.id,other.id)
  assert.equal(dialog.open,false)
  let nativeModalStarts = 0
  const nativeShowModal = dialog.showModal.bind(dialog)
  dialog.showModal = () => { nativeModalStarts++; nativeShowModal() }
  await begin()
  await eventually(() => assert.ok(dialog.contains(document.activeElement),'Core moves initial focus into modal'))
  assert.equal(nativeModalStarts,1)
  start.click()
  assert.equal(nativeModalStarts,1)
  assert.equal(dialog.getAttribute('aria-modal'),'true')
  assert.notEqual(dialog.getAttribute('role'),'alertdialog')
  assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent,'Orientation')
  assert.equal(document.getElementById(dialog.getAttribute('aria-describedby')).textContent,'Find your way around.')
  assert.match(dialog.querySelector('[role="status"]').textContent,/1 of 2/)
  assert.equal(action('Back').disabled,true)
  dialog.dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}))
  await shown('Orientation')
  await next()
  assert.match(dialog.querySelector('[role="status"]').textContent,/2 of 2/)
  assert.equal(action('Back').disabled,false)
  action('Back').click()
  await shown('Orientation')
  await next()
  // Closing or cancelling on the last step is not completion.
  action('Close').click()
  await ended(['dismissed'])
  await begin()
  await next()
  assert.equal(dialog.dispatchEvent(new window.Event('cancel',{bubbles:false,cancelable:true})),false)
  await ended(['dismissed','dismissed'])
  await begin()
  await next()
  // The core leaves outside dismissal off. Happy DOM does not model native background inert, tested separately below.
  await pause(80)
  outside.dispatchEvent(new window.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerType:'mouse',clientX:90,clientY:90}))
  await pause(80)
  await shown('Ready to start')
  action('Finish').click()
  await ended(['dismissed','dismissed','finished'])
  assert.equal(submits,0)
  otherStart.focus()
  otherStart.click()
  await eventually(() => {
    assert.equal(other.open,true)
    assert.equal(other.dataset.state,'open')
  })
  other.querySelector('[data-part="close-trigger"]').click()
  await eventually(() => {
    assert.equal(other.open,false)
    assert.equal(other.dataset.state,'closed')
    assert.equal(document.activeElement,otherStart)
    assert.deepEqual(outcomes,['dismissed','dismissed','finished','single:dismissed'])
  })
  otherStart.click()
  const finishSingle = await eventually(() => {
    assert.equal(other.open,true)
    const button = [...other.querySelectorAll('button')].find(button => button.textContent.trim()==='Finish')
    assert.ok(button)
    return button
  })
  finishSingle.click()
  await eventually(() => {
    assert.equal(other.open,false)
    assert.equal(document.activeElement,otherStart)
    assert.deepEqual(outcomes,['dismissed','dismissed','finished','single:dismissed','single:finished'])
  })
  await dom.happyDOM.close()
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Tour navigates modal steps and distinguishes Finish from Close/Cancel in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-tour-'))
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
        await build({
          root, configFile:false, logLevel:'error', plugins:[plugin],
          // Vite library mode leaves process.env references intact unless defined.
          define:{'process.env.NODE_ENV':JSON.stringify('production')},
          build:{outDir:join(dir,'out'),lib:{entry,formats:['es'],fileName:()=> 'tour.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}},
        })
        const bundle = join(dir,'out/tour.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle], { timeout:12000, stdio:'inherit' })
        if (process.env.READY_CHROMIUM_PATH) {
          const { chromium } = await import('playwright')
          const browser = await chromium.launch({executablePath:process.env.READY_CHROMIUM_PATH})
          const pageErrors = []
          try {
            const page = await browser.newPage()
            page.on('pageerror', error => pageErrors.push(error.message))
            await page.setContent('<main id="app"></main><script>window.outcomes=[];window.record=v=>window.outcomes.push(v)</script>')
            const styling = await readFile(join(ready,'Tour.css'),'utf8')
            await page.addStyleTag({content:`dialog { margin: 0 }
${styling}`})
            await page.addScriptTag({type:'module',content:await readFile(bundle,'utf8')})
            const launch = page.getByRole('button',{name:'Start tour',exact:true})
            const modal = page.getByRole('dialog')
            await launch.click()
            await modal.waitFor({state:'visible'})
            assert.equal(await modal.evaluate(node=>node.matches(':modal')),true)
            assert.equal(await modal.evaluate(node=>{
              const rect=node.getBoundingClientRect()
              return Math.abs(rect.left+rect.width/2-innerWidth/2)<1 &&
                Math.abs(rect.top+rect.height/2-innerHeight/2)<1
            }),true)
            await page.waitForFunction(()=>document.querySelector('dialog').contains(document.activeElement))
            await page.locator('#outside').evaluate(button=>button.focus())
            assert.equal(await modal.evaluate(node=>node.contains(document.activeElement)),true)
            for (let i=0;i<4;i++) {
              await page.keyboard.press('Tab')
              assert.equal(await modal.evaluate(node=>node.contains(document.activeElement)),true)
            }
            // Clicking the backdrop should neither dismiss the modal nor focus the page.
            await page.mouse.click(2,2)
            assert.equal(await modal.isVisible(),true)
            await modal.getByRole('button',{name:'Next'}).click()
            await page.keyboard.press('Escape')
            await modal.waitFor({state:'hidden'})
            assert.deepEqual(await page.evaluate(()=>window.outcomes),['dismissed'])
            assert.equal(await launch.evaluate(node=>node===document.activeElement),true)
            await launch.click()
            await modal.getByRole('button',{name:'Next'}).click()
            await modal.getByRole('button',{name:'Finish'}).click()
            await modal.waitFor({state:'hidden'})
            assert.deepEqual(await page.evaluate(()=>window.outcomes),['dismissed','finished'])
            assert.equal(await launch.evaluate(node=>node===document.activeElement),true)
          } finally {
            await browser.close()
            assert.deepEqual(pageErrors, [], 'Tour browser fixture runtime errors')
          }
        }
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
