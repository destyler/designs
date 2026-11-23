import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const origin = 'https://ready-final-controls.test'
const frameworks = ['react', 'vue', 'solid', 'svelte']
const plugins = {
  react: async () => [(await import('@vitejs/plugin-react')).default()],
  vue: async () => [(await import('@vitejs/plugin-vue')).default()],
  solid: async () => [(await import('vite-plugin-solid')).default()],
  svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
}
const ext = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
const components = { 'color-picker': 'ColorPicker', signature: 'Signature', timer: 'Timer' }

function fixture(framework, family) {
  const name = components[family]
  const jsx = framework === 'react' || framework === 'solid'
  const vue = framework === 'vue'
  const source = `../../packages/ready/${framework}/${name}.${ext[framework]}`
  const bind = (key, expression) => vue ? `:${key}="${expression}"` : `${key}={${expression}}`
  const record = vue ? (family === 'signature' ? '@paths-change="record"' : '@value-change="record"')
    : family === 'signature' ? 'onPathsChange={record}' : 'onValueChange={record}'
  const markup = {
    'color-picker': `<ColorPicker label="Accent" ${bind('defaultValue', "'#112233'")} ${bind('presets', 'presets')} ${record} />
      <ColorPicker label="Locked value" value="#123456" ${record} />
      <ColorPicker label="Disabled color" ${bind('disabled', 'true')} />`,
    signature: `<Signature label="Draw a sample" ${record} /><Signature label="Disabled drawing" ${bind('disabled', 'true')} />`,
    timer: '<Timer label="Elapsed time" />',
  }[family]
  const submit = vue ? '@submit.prevent="submit"' : jsx ? 'onSubmit={event=>{event.preventDefault();submit()}}'
    : 'onsubmit={event=>{event.preventDefault();submit()}}'
  const body = `<form ${submit}><button id="before" type="button">Before</button>${markup}
    <button id="after" type="button">After</button><output id="events">[]</output><output id="submits">0</output></form>`
  const declarations = `import ${jsx ? `{ ${name} }` : name} from '${source}';
    const presets=['#2277CC','#FFAA00'];
    const records=[];
    const record=value=>{records.push(value);document.getElementById('events').textContent=JSON.stringify(records)};
    const submit=()=>{const node=document.getElementById('submits');node.textContent=String(Number(node.textContent)+1)};`
  if (framework === 'react') return { text: `import {createRoot} from 'react-dom/client'; ${declarations}
    createRoot(document.getElementById('root')).render(${body});` }
  if (framework === 'solid') return { text: `import {render} from 'solid-js/web'; ${declarations}
    render(()=> (${body}),document.getElementById('root'));` }
  if (vue) return { text: `<script setup>${declarations}</script><template>${body}</template>`,
    mount: "import {createApp} from 'vue'; import Fixture from './Fixture.vue'; createApp(Fixture).mount('#root');" }
  return { text: `<script>${declarations}</script>${body}`,
    mount: "import {mount} from 'svelte'; import Fixture from './Fixture.svelte'; mount(Fixture,{target:document.getElementById('root')});" }
}

const active = locator => locator.evaluate(node => document.activeElement === node)
const log = async page => JSON.parse(await page.locator('#events').textContent())
const waitForLog = async (page, entries) => page.waitForFunction(entries =>
  document.getElementById('events').textContent === JSON.stringify(entries), entries)
const noSubmit = async page => assert.equal(await page.locator('#submits').textContent(), '0')
const normalizeText = text => text.trim()
const verifier = {
  async 'color-picker'(page) {
    const input = page.getByRole('textbox', { name: 'Accent', exact: true })
    const locked = page.getByRole('textbox', { name: 'Locked value', exact: true })
    const disabled = page.getByRole('textbox', { name: 'Disabled color', exact: true })
    assert.equal(await input.inputValue(), '#112233')
    assert.equal(await disabled.isDisabled(), true)
    await input.fill('#aA00bB')
    await page.keyboard.press('Enter')
    await waitForLog(page, ['#AA00BB'])
    assert.equal(await input.inputValue(), '#AA00BB')
    assert.ok(await active(input))
    await noSubmit(page)
    await input.fill('invalid')
    await page.keyboard.press('Enter')
    assert.equal(await input.inputValue(), '#AA00BB')
    await input.fill('#123ABC')
    await page.keyboard.press('Escape')
    assert.equal(await input.inputValue(), '#AA00BB')
    const button = page.getByRole('button', { name: 'Select #2277CC', exact: true })
    await button.focus()
    await page.keyboard.press('Space')
    await waitForLog(page, ['#AA00BB', '#2277CC'])
    assert.equal(await input.inputValue(), '#2277CC')
    assert.equal(await button.getAttribute('aria-pressed'), 'true')
    await locked.fill('#ABCD10')
    await page.keyboard.press('Enter')
    await waitForLog(page, ['#AA00BB', '#2277CC', '#ABCD10'])
    assert.equal(await locked.inputValue(), '#123456', 'control that did not accept proposal stays authoritative')
    await noSubmit(page)
  },
  async signature(page) {
    const controls = page.locator('[data-scope=signature][data-part=control]')
    const pad = controls.first()
    const disabled = controls.nth(1)
    const segments = page.locator('[data-scope=signature][data-part=segment-path]')
    const clear = page.locator('[data-scope=signature][data-part=clear-trigger]').first()
    await pad.waitFor()
    const drag = async (surface, cancel = false) => {
      const box = await surface.boundingBox()
      assert.ok(box && box.width >= 80 && box.height >= 40, 'visible pointer surface')
      const x = box.x + Math.round(box.width * .30), y = box.y + Math.round(box.height * .25)
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + 25, y + 12, { steps: 4 })
      await page.mouse.move(x + 50, y + 25, { steps: 4 })
      if (cancel) {
        // Chromium drives the stroke; pointercancel is explicitly injected to model loss of input.
        await surface.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', bubbles: true })
      }
      await page.mouse.up()
    }
    await drag(pad)
    await page.waitForFunction(() => JSON.parse(document.getElementById('events').textContent).length === 1)
    const first = await log(page)
    assert.equal(first[0].length, 1)
    assert.ok(typeof first[0][0] === 'string' && first[0][0].length > 8)
    assert.equal(await segments.count(), 1)
    await drag(pad, true)
    assert.deepEqual(await log(page), first, 'cancelled stroke does not publish or replace prior path')
    assert.equal(await segments.count(), 1)
    await drag(disabled)
    assert.deepEqual(await log(page), first)
    await clear.focus()
    await page.keyboard.press('Enter')
    await waitForLog(page, [first[0], []])
    assert.equal(await segments.count(), 0)
    assert.ok(await active(clear), 'clear remains a usable keyboard control after emptying pad')
    assert.equal(await page.locator('input[type=hidden]').count(), 0)
    await noSubmit(page)
  },
  async timer(page) {
    const group = page.getByRole('group', { name: 'Elapsed time' })
    const clock = group.getByRole('timer')
    const button = name => group.getByRole('button', { name, exact: true })
    const display = async () => normalizeText(await clock.textContent())
    const waitText = async value => page.waitForFunction(value =>
      document.querySelector('[role=timer]').textContent.trim() !== value, value, { timeout: 3500 })
    assert.equal(await display(), '00:00:00')
    assert.equal(await clock.getAttribute('aria-live'), 'off')
    const primary = await button('Start').elementHandle()
    assert.equal(await button('Start').getAttribute('type'), 'button')
    assert.equal(await button('Reset').getAttribute('type'), 'button')
    await button('Start').focus()
    await page.keyboard.press('Enter')
    await button('Pause').waitFor()
    assert.ok(await primary.evaluate(node => node === document.activeElement))
    await waitText('00:00:00')
    await page.keyboard.press('Space')
    await button('Resume').waitFor()
    const paused = await display()
    await new Promise(resolve => setTimeout(resolve, 1150))
    assert.equal(await display(), paused, 'real wall-clock time does not advance while paused')
    await page.keyboard.press('Enter')
    await button('Pause').waitFor()
    await waitText(paused)
    await button('Reset').click()
    await button('Start').waitFor()
    assert.equal(await display(), '00:00:00')
    await new Promise(resolve => setTimeout(resolve, 1150))
    assert.equal(await display(), '00:00:00', 'reset leaves idle and does not restart')
    await noSubmit(page)
  },
}

const families = process.argv.slice(2)
const selected = families.length ? families : Object.keys(components)
const selectedFrameworks = process.env.READY_BROWSER_FRAMEWORKS?.split(',') ?? frameworks
for (const family of selected) assert.ok(components[family], `Unknown family: ${family}`)
for (const framework of selectedFrameworks) assert.ok(plugins[framework], `Unknown framework: ${framework}`)
const directory = await mkdtemp(join(root, 'node_modules/.ready-final-controls-'))
const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const failures = []
let browser
try {
  // Default launch uses Playwright's installed headless shell. CHROMIUM_PATH is an explicit opt-in.
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  for (const family of selected) for (const framework of selectedFrameworks) {
    const { text, mount } = fixture(framework, family)
    const out = join(directory, 'out')
    let context
    try {
      await writeFile(join(directory, 'index.html'), '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ready controls fixture</title><div id="root" data-rd-theme="default"></div><script type="module" src="./entry.js"></script>')
      await writeFile(join(directory, `Fixture.${ext[framework]}`), text)
      await writeFile(join(directory, 'entry.js'), `import '../../packages/ready/theme.css'; ${mount ?? `import './Fixture.${ext[framework]}';`}`)
      await build({ root: directory, configFile: false, base: './', plugins: await plugins[framework](), logLevel: 'error', build: { outDir: out, emptyOutDir: true } })
      context = await browser.newContext({ viewport: { width: 360, height: 760 } })
      context.setDefaultTimeout(4000)
      const unexpected = []
      await context.route('**/*', async route => {
        const url = new URL(route.request().url())
        if (url.origin !== origin) { unexpected.push(url.origin); return route.abort() }
        const name = url.pathname.slice(1)
        if (!/^(index\.html|assets\/[\w.-]+)$/.test(name)) return route.fulfill({ status: 404 })
        return route.fulfill({ contentType: contentTypes[extname(name)], body: await readFile(join(out, name)) })
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${origin}/index.html`)
      await page.locator('#before').waitFor()
      await verifier[family](page)
      assert.deepEqual(errors, [])
      assert.deepEqual(unexpected, [])
      console.log(`PASS ${family} ${framework}`)
    } catch (error) {
      failures.push(`${family} ${framework}: ${error.stack}`)
      console.error(failures.at(-1))
    } finally { await context?.close() }
  }
} finally {
  await browser?.close()
  await rm(directory, { recursive: true, force: true })
}
assert.equal(failures.length, 0, `${failures.length} final-control browser cases failed`)
