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
const body = attributes => `
  <form>
    <button id="before" type="button">Before</button>
    <section id="main"><Edit label="Project name" ${attributes} /></section>
    <button id="outside" type="button">Outside</button>
    <section id="disabled"><Edit label="Locked name" placeholder="Nothing yet" disabled /></section>
    <button id="after" type="button">After</button>
    <button type="submit">Submit form</button>
  </form>`
const shared = `import {editOptions} from '${ready}/Edit';window.editOptions=editOptions;
 const record=value=>window.record(value);`
const fixtures = {
  react: `import {createRoot} from 'react-dom/client';import {Edit} from '${ready}/react/Edit';${shared}
    createRoot(document.getElementById('app')).render(${body('defaultValue="Draft" maxLength={12} onValueCommit={record}')});`,
  solid: `import {render} from 'solid-js/web';import {Edit} from '${ready}/solid/Edit';${shared}
    render(()=> (${body('defaultValue="Draft" maxLength={12} onValueCommit={record}')}),document.getElementById('app'));`,
  vue: `<script setup>import Edit from '${ready}/vue/Edit.vue';${shared}</script>
    <template>${body('default-value="Draft" :max-length="12" @value-commit="record"')}</template>`,
  svelte: `<script>import Edit from '${ready}/svelte/Edit.svelte';${shared}</script>
    ${body('defaultValue="Draft" maxLength={12} onValueCommit={record}')}`,
}

if (process.argv[2] === '--dom') {
  const { Window } = await import('happy-dom')
  const dom = new Window()
  for (const name of Object.getOwnPropertyNames(dom)) {
    if (/^(HTML.*Element|SVG.*Element|Element|Node|Document|DocumentFragment|Text|Comment|Event|CustomEvent|KeyboardEvent|InputEvent|CompositionEvent|FocusEvent|MouseEvent|PointerEvent|CSS|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(name)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom[name] })
    }
  }
  globalThis.window = dom
  globalThis.document = dom.document
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = dom[key].bind(dom)
  document.body.innerHTML = '<main id="app"></main>'
  const values = []
  window.record = value => values.push(value)
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
    assert.ok(node?.querySelector('[data-part="edit-trigger"]'), document.body.innerHTML)
    return node
  })
  for (const props of [{label:'   '},{defaultValue:'One\nTwo'},{maxLength:0},{defaultValue:'123',maxLength:2}]) {
    assert.throws(() => window.editOptions({label:'Name',...props}), /Ready Edit:/)
  }
  const part = name => main.querySelector(`[data-part="${name}"]`)
  const input = part('input')
  const preview = part('preview')
  const edit = part('edit-trigger')
  const save = part('submit-trigger')
  const cancel = part('cancel-trigger')
  const outside = document.querySelector('#outside')
  const disabled = document.querySelector('#disabled')
  document.querySelector('form').addEventListener('submit', event => { event.preventDefault(); submits++ })
  assert.equal(input.labels[0].textContent,'Project name')
  assert.equal(input.maxLength,12)
  assert.equal(preview.hasAttribute('tabindex'),false)
  assert.equal(preview.hasAttribute('aria-label'),false)
  preview.dispatchEvent(new window.MouseEvent('dblclick',{bubbles:true,cancelable:true}))
  assert.equal(input.hidden,true)
  assert.equal(disabled.querySelector('[data-part="preview"]').textContent,'Nothing yet')
  const locked = disabled.querySelector('[data-part="edit-trigger"]')
  assert.equal(locked.disabled,true)
  locked.click()
  assert.equal(disabled.querySelector('input').hidden,true)
  assert.notEqual(disabled.querySelector('input').id,input.id)
  const reopen = async value => {
    edit.click()
    await eventually(() => {
      assert.equal(input.hidden,false)
      assert.equal(input.value,value)
      assert.ok(document.activeElement===input,'The input receives focus')
    })
  }
  const check = async (value, focus, committed) => eventually(() => {
    assert.equal(input.hidden,true)
    assert.equal(preview.textContent,value)
    assert.deepEqual(values,committed)
    assert.ok(document.activeElement===focus,'Focus stays at the expected destination')
  })
  const setNative = (value, composing=false) => {
    input.value = value
    input.dispatchEvent(new window.InputEvent('input',{bubbles:true,data:value,inputType:composing?'insertCompositionText':'insertText',isComposing:composing}))
  }
  const key = (key, extras={}) => input.dispatchEvent(new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extras}))

  await reopen('Draft')
  setNative('Ship it')
  save.focus()
  assert.equal(input.hidden,false,'Moving focus to Save must not cancel the draft')
  save.click()
  await check('Ship it',edit,['Ship it'])
  await reopen('Ship it')
  setNative('Cancelled')
  cancel.click()
  await check('Ship it',edit,['Ship it'])
  await reopen('Ship it')
  setNative('Discard')
  assert.equal(key('Escape'),false)
  await check('Ship it',edit,['Ship it'])
  await reopen('Ship it')
  setNative('Outside')
  outside.focus()
  await check('Ship it',outside,['Ship it'])
  await reopen('Ship it')
  input.dispatchEvent(new window.CompositionEvent('compositionstart',{bubbles:true}))
  setNative('中文',true)
  assert.equal(key('Enter',{isComposing:true}),true)
  assert.equal(key('Escape',{isComposing:true}),true)
  assert.equal(input.hidden,false)
  assert.deepEqual(values,['Ship it'])
  input.dispatchEvent(new window.CompositionEvent('compositionend',{bubbles:true,data:'中文'}))
  assert.equal(key('Enter'),false)
  await check('中文',edit,['Ship it','中文'])
  await reopen('中文')
  setNative('0123456789extra')
  assert.equal(key('Enter'),false)
  await check('0123456789ex',edit,['Ship it','中文','0123456789ex'])
  assert.equal(submits,0)
  await dom.happyDOM.close()
} else {
  for (const [framework, fixture] of Object.entries(fixtures)) {
    test(`Ready Edit saves, cancels, and preserves input and focus semantics in ${framework}`, { timeout: 60000 }, async () => {
      const dir = await mkdtemp(join(root, 'node_modules/.ready-edit-'))
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
          build:{outDir:join(dir,'out'),lib:{entry,formats:['es'],fileName:()=> 'edit.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}},
        })
        const bundle = join(dir,'out/edit.mjs')
        execFileSync(process.execPath, [filename, '--dom', bundle], { timeout:12000, stdio:'inherit' })
        if (process.env.READY_CHROMIUM_PATH) {
          const { chromium } = await import('playwright')
          const browser = await chromium.launch({executablePath:process.env.READY_CHROMIUM_PATH})
          const errors = []
          try {
            const page = await browser.newPage()
            page.setDefaultTimeout(4500)
            page.on('pageerror', error => errors.push(error.message))
            await page.setContent('<main id="app"></main><script>window.values=[];window.submits=0;window.record=v=>window.values.push(v);document.addEventListener("submit",e=>{e.preventDefault();window.submits++})</script>')
            await page.addStyleTag({content:await readFile(join(ready,'Edit.css'),'utf8')})
            await page.addScriptTag({type:'module',content:await readFile(bundle,'utf8')})
            const main = page.locator('#main')
            const textbox = main.getByRole('textbox',{name:'Project name'})
            const edit = main.getByRole('button',{name:'Edit Project name'})
            const save = main.getByRole('button',{name:'Save Project name'})
            const check = async (value, focus, committed) => {
              await main.locator('[data-part=preview]').waitFor({state:'visible'})
              assert.equal(await main.locator('[data-part=preview]').textContent(),value)
              await page.waitForFunction(selector=>document.querySelector(selector)===document.activeElement, focus)
              assert.deepEqual(await page.evaluate(()=>window.values),committed)
            }
            await page.locator('#before').focus()
            await page.keyboard.press('Tab')
            assert.equal(await edit.evaluate(el=>document.activeElement===el),true)
            await page.keyboard.press('Enter')
            await textbox.waitFor({state:'visible'})
            await textbox.fill('Keyboard')
            await page.keyboard.press('Tab')
            assert.equal(await save.evaluate(el=>document.activeElement===el),true)
            await page.keyboard.press('Space')
            await check('Keyboard','#main [data-part=edit-trigger]',['Keyboard'])
            await edit.click()
            await textbox.fill('Mouse')
            await main.getByText('Project name',{exact:true}).click()
            assert.equal(await textbox.isVisible(),true)
            await save.click()
            await check('Mouse','#main [data-part=edit-trigger]',['Keyboard','Mouse'])
            await edit.click()
            await textbox.fill('Abandoned')
            await page.locator('#outside').click()
            await check('Mouse','#outside',['Keyboard','Mouse'])
            await page.keyboard.press('Tab')
            assert.equal(await page.locator('#after').evaluate(el=>document.activeElement===el),true)
            assert.equal(await page.getByRole('button',{name:'Edit Locked name'}).isDisabled(),true)
            await page.getByRole('button',{name:'Edit Locked name'}).evaluate(el=>el.click())
            assert.equal(await page.locator('#disabled input').isVisible(),false)
            await edit.click()
            await textbox.fill('Escape')
            await page.keyboard.press('Escape')
            await check('Mouse','#main [data-part=edit-trigger]',['Keyboard','Mouse'])
            await edit.click()
            await textbox.evaluate(el=>{
              el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}))
              el.value='中文'
              el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,data:'中文',inputType:'insertCompositionText'}))
              el.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'Enter',isComposing:true}))
            })
            assert.equal(await textbox.isVisible(),true)
            assert.deepEqual(await page.evaluate(()=>window.values),['Keyboard','Mouse'])
            await textbox.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'中文'})))
            await page.keyboard.press('Enter')
            await check('中文','#main [data-part=edit-trigger]',['Keyboard','Mouse','中文'])
            assert.equal(await page.evaluate(()=>window.submits),0)
          } finally {
            await browser.close()
            assert.deepEqual(errors,[],'Edit browser fixture runtime errors')
          }
        }
      } finally { await rm(dir, {recursive:true,force:true}) }
    })
  }
}
