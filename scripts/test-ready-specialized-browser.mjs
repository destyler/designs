import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const origin = 'https://ready-specialized.test'
const frameworks = ['react', 'vue', 'solid', 'svelte']
const items = [
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic', disabled: true },
  { value: 'underline', label: 'Underline' },
]
const copied = 'Synthetic copy fixture: 测试 🐉'
const plugins = {
  react: async () => [(await import('@vitejs/plugin-react')).default()],
  vue: async () => [(await import('@vitejs/plugin-vue')).default()],
  solid: async () => [(await import('vite-plugin-solid')).default()],
  svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte({ configFile: false }),
}
const ext = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
const component = { clipboard: 'Clipboard', edit: 'Edit', 'qr-code': 'QRCode', 'toggle-group': 'ToggleGroup' }

function fixture(framework, family) {
  const name = component[family]
  const jsx = framework === 'react' || framework === 'solid'
  const source = `../../packages/ready/${framework}/${name}.${ext[framework]}`
  const importComponent = `import ${jsx ? `{ ${name} }` : name} from '${source}';`
  const state = (framework === 'react' ? "import {useState} from 'react'; const App=()=>{const [event,setEvent]=useState([]);"
    : framework === 'solid' ? "import {createSignal} from 'solid-js'; const App=()=>{const [event,setEvent]=createSignal([]);"
      : framework === 'vue' ? "import {ref} from 'vue'; const event=ref([]);const setEvent=(value)=>{event.value=[...event.value,value]};"
        : 'let event=$state([]); const setEvent=(value)=>{event=[...event,value]};')
  const handler = framework === 'vue' ? '@value-commit="setEvent"' : jsx ? 'onValueCommit={value=>setEvent(previous=>[...previous,value])}' : 'onValueCommit={setEvent}'
  const log = framework === 'vue' ? '{{JSON.stringify(event)}}' : framework === 'solid' ? '{JSON.stringify(event())}' : '{JSON.stringify(event)}'
  const assign = (key, expression) => framework === 'vue' ? `:${key}="${expression}"` : `${key}={${expression}}`
  const markup = {
    clipboard: `<Clipboard label="Copy fixture" value="${copied}" />`,
    edit: `<Edit label="Display name" defaultValue="Original" ${handler} /><output id="events">${log}</output>`,
    'qr-code': `<div id="narrow"><QRCode label="Sample code" value="设计 🐉" ${assign('size', 256)} /></div>`,
    'toggle-group': `<ToggleGroup label="Formatting" ${assign('items', 'items')} ${assign('defaultValue', "['bold']")} />`,
  }[family]
  const body = `<div><button id="before">Before</button>${markup}<button id="after">After</button></div>`
  const declarations = `${importComponent} ${family === 'toggle-group' ? `const items=${JSON.stringify(items)};` : ''}`
  if (framework === 'react') return { text: `import {createRoot} from 'react-dom/client'; ${declarations} ${state} return (${body})}; createRoot(document.getElementById('root')).render(<App/>);` }
  if (framework === 'solid') return { text: `import {render} from 'solid-js/web'; ${declarations} ${state} return (${body})}; render(()=><App/>,document.getElementById('root'));` }
  if (framework === 'vue') return { text: `<script setup>${declarations} ${state}</script><template>${body}</template>`, mount: "import {createApp} from 'vue'; import Fixture from './Fixture.vue'; createApp(Fixture).mount('#root');" }
  return { text: `<script>${declarations} ${state}</script>${body}`, mount: "import {mount} from 'svelte'; import Fixture from './Fixture.svelte'; mount(Fixture,{target:document.getElementById('root')});" }
}

// Navigate only fixture files; route-only HTTPS makes Clipboard a secure context without a real outbound request.
const focused = locator => locator.evaluate(node => node === document.activeElement)
const awaitFocus = locator => locator.evaluate(async node => {
  for (let i = 0; i < 100 && document.activeElement !== node; i++) await new Promise(resolve => setTimeout(resolve, 10))
  return node === document.activeElement
})
const trigger = page => page.locator('button[data-rd-copy-button]')
const verification = {
  async clipboard(page, context, open) {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin })
    await page.evaluate(() => navigator.clipboard.writeText('old fixture value'))
    await trigger(page).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('status').getByText('Copied to clipboard', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), copied)
    assert.ok(await focused(trigger(page)), 'successful copy preserves keyboard focus')
    for (const mode of ['missing', 'denied']) {
      const unavailable = await context.newPage()
      try {
        await unavailable.addInitScript(mode => {
          const value = mode === 'missing' ? undefined : {
            writeText: () => Promise.reject(new DOMException('Test permission denial', 'NotAllowedError')),
          }
          Object.defineProperty(navigator, 'clipboard', { configurable: true, value })
        }, mode)
        await open(unavailable)
        await trigger(unavailable).click()
        await unavailable.getByRole('status').getByText('Could not copy. Select the text and copy it manually.', { exact: true }).waitFor()
        const manual = unavailable.getByRole('textbox', { name: 'Copy fixture' })
        assert.equal(await manual.inputValue(), copied, `${mode}: fallback exposes exactly the unmodified fixture text`)
        await manual.focus()
        await unavailable.keyboard.press('ControlOrMeta+a')
        assert.equal(await manual.evaluate(input => input.value.slice(input.selectionStart, input.selectionEnd)), copied)
      } finally { await unavailable.close() }
    }
  },
  async edit(page) {
    const edit = page.locator('[data-scope="edit"][data-part="edit-trigger"]')
    const input = page.getByRole('textbox', { name: 'Display name' })
    const changes = page.locator('#events')
    await edit.focus()
    await page.keyboard.press('Enter')
    assert.ok(await awaitFocus(input), 'keyboard start focuses edit input')
    await input.fill('Changed')
    await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
    assert.ok(await focused(input), 'IME Enter does not save')
    assert.equal(await changes.textContent(), '[]')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('#events').textContent === '["Changed"]')
    await edit.waitFor()
    assert.ok(await awaitFocus(edit), 'commit returns focus to edit trigger')
    await page.keyboard.press('Enter')
    await input.fill('Discard')
    await page.keyboard.press('Escape')
    assert.ok(await awaitFocus(edit), 'Escape returns focus to edit trigger')
    assert.equal(await changes.textContent(), '["Changed"]')
    await page.keyboard.press('Enter')
    assert.equal(await input.inputValue(), 'Changed', 'cancel does not change committed content')
    await input.fill('Outside discard')
    await page.locator('#after').click()
    await edit.waitFor()
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const outsideFocus = await page.evaluate(() => {
      const node = document.activeElement
      return node?.id || node?.tagName
    })
    assert.equal(outsideFocus, 'after', 'outside click leaves focus at the clicked control')
    assert.equal(await changes.textContent(), '["Changed"]')
  },
  async 'qr-code'(page) {
    const image = page.getByRole('img', { name: 'Sample code' })
    const geometry = await image.evaluate(svg => {
      const path = svg.querySelector('path[data-part="pattern"]')
      const { x, y, width, height } = path.getBBox()
      const bounds = svg.viewBox.baseVal
      const { width: renderedWidth, height: renderedHeight } = svg.getBoundingClientRect()
      return {
        zones: [x - bounds.x, y - bounds.y, bounds.x + bounds.width - x - width, bounds.y + bounds.height - y - height],
        rendered: [renderedWidth, renderedHeight], background: getComputedStyle(svg).backgroundColor,
        fill: getComputedStyle(path).fill, intrinsic: [svg.getAttribute('width'), svg.getAttribute('height')],
      }
    })
    assert.ok(geometry.zones.every(zone => zone >= 40), JSON.stringify(geometry))
    assert.ok(geometry.rendered.every(size => size > 0 && size <= 181), JSON.stringify(geometry))
    assert.ok(Math.abs(geometry.rendered[0] - geometry.rendered[1]) < 1)
    assert.deepEqual(geometry.intrinsic, ['256', '256'])
    assert.equal(geometry.background, 'rgb(255, 255, 255)')
    assert.equal(geometry.fill, 'rgb(17, 24, 39)')
  },
  async 'toggle-group'(page) {
    const group = page.getByRole('group', { name: 'Formatting' })
    const bold = group.getByRole('button', { name: 'Bold' })
    const italic = group.getByRole('button', { name: 'Italic' })
    const underline = group.getByRole('button', { name: 'Underline' })
    assert.equal(await bold.getAttribute('aria-pressed'), 'true')
    assert.equal(await italic.isDisabled(), true)
    await page.locator('#before').focus()
    await page.keyboard.press('Tab')
    assert.ok(await awaitFocus(bold), 'one Tab reaches the group')
    await page.keyboard.press('ArrowRight')
    assert.ok(await awaitFocus(underline), 'Arrow skips disabled item')
    assert.equal(await underline.getAttribute('aria-pressed'), 'false', 'arrow move does not select')
    await page.keyboard.press('Space')
    assert.equal(await underline.getAttribute('aria-pressed'), 'true')
    assert.equal(await bold.getAttribute('aria-pressed'), 'true', 'multiple items independently pressed')
    await page.keyboard.press('Enter')
    assert.equal(await underline.getAttribute('aria-pressed'), 'false')
    await page.keyboard.press('Tab')
    assert.ok(await awaitFocus(page.locator('#after')), 'one Tab exits the group')
    await page.keyboard.press('Shift+Tab')
    assert.ok(await awaitFocus(underline), 'Shift+Tab enters the last roving item')
    await page.keyboard.press('Shift+Tab')
    assert.ok(await awaitFocus(page.locator('#before')), 'one Shift+Tab exits before the group')
  },
}

const families = process.argv.slice(2)
const selected = families.length ? families : Object.keys(component)
for (const family of selected) assert.ok(component[family], `Unknown family: ${family}`)
const directory = await mkdtemp(join(root, 'node_modules/.ready-specialized-'))
const executablePath = process.env.CHROMIUM_PATH || (existsSync(chromium.executablePath()) ? undefined : existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const failures = []
let browser
try {
  browser = await chromium.launch({ executablePath })
  for (const family of selected) for (const framework of frameworks) {
    const { text, mount } = fixture(framework, family)
    const out = join(directory, 'out')
    await writeFile(join(directory, 'index.html'), '<!doctype html><html lang="en"><title>Ready test fixture</title><style>#narrow{width:180px}</style><div id="root"></div><script type="module" src="./entry.js"></script>')
    await writeFile(join(directory, `Fixture.${ext[framework]}`), text)
    await writeFile(join(directory, 'entry.js'), `import '../../packages/ready/theme.css'; ${mount ?? `import './Fixture.${ext[framework]}';`}`)
    let context
    try {
      await build({ root: directory, configFile: false, base: './', plugins: await plugins[framework](), logLevel: 'error', build: { outDir: out } })
      context = await browser.newContext()
      context.setDefaultTimeout(4000)
      await context.route(`${origin}/**`, async route => {
        const name = new URL(route.request().url()).pathname.slice(1)
        if (!/^(index\.html|assets\/[\w.-]+)$/.test(name)) return route.fulfill({ status: 404 })
        return route.fulfill({ contentType: contentTypes[extname(name)], body: await readFile(join(out, name)) })
      })
      const errors = []
      const open = async page => {
        page.on('pageerror', error => errors.push(error.message))
        await page.goto(`${origin}/index.html`)
        await page.locator('#before').waitFor()
      }
      const page = await context.newPage()
      await open(page)
      await verification[family](page, context, open)
      assert.deepEqual(errors, [])
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
assert.equal(failures.length, 0, `${failures.length} specialized browser cases failed`)
