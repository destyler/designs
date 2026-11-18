// Compile the actual documented snippets; simulated DOM does not prove browser acceptance.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { controlledSelectSnippet } from '../examples/ready-docs/content.ts'
const root = fileURLToPath(new URL('../', import.meta.url))

if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/' })
  for (const key of Object.getOwnPropertyNames(win)) if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
    try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const target = document.createElement('form'); document.body.append(target)
  const { run } = await import(pathToFileURL(process.argv[3]))
  const cleanup = run(target)
  const eventually = async check => {
    const end = Date.now() + 3000
    for (;;) { try { check(); return } catch (error) { if (Date.now() > end) throw error; await new Promise(resolve => setTimeout(resolve, 20)) } }
  }
  const assertValue = (value, label) => {
    assert.equal(target.querySelector('select')?.value, value)
    assert.equal(target.querySelector('[data-part=value-text]')?.textContent, label)
    assert.deepEqual([...new win.FormData(target)], [['workspace', value]])
    assert.match(target.textContent, new RegExp(`当前值：${value || '未选择'}`))
  }
  await eventually(() => assertValue('studio', '设计工作室'))
  target.querySelector('[data-part=trigger]').click()
  await eventually(() => assert.equal(target.querySelector('[data-part=trigger]').getAttribute('aria-expanded'), 'true'))
  target.querySelector('[data-part=item][data-value=personal]').click()
  await eventually(() => assertValue('personal', '个人空间'))
  const clear = [...target.querySelectorAll('button')].find(button => button.textContent === '清空选择')
  assert.equal(clear.type, 'button')
  clear.click(); await eventually(() => assertValue('', '请选择'))
  clear.click(); await eventually(() => assertValue('', '请选择'))
  target.querySelector('[data-part=trigger]').click()
  await eventually(() => assert.equal(target.querySelector('[data-part=trigger]').getAttribute('aria-expanded'), 'true'))
  target.querySelector('[data-part=item][data-value=studio]').click()
  await eventually(() => assertValue('studio', '设计工作室'))
  await cleanup(); await win.happyDOM.close()
  console.log('PASS documented controlled Select accepts changes, clears repeatedly and reselects')
} else for (const framework of ['React', 'Vue', 'Solid', 'Svelte']) {
  test(`Documented ${framework} controlled Select accepts, clears and reselects`, { timeout: 120000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-docs-controlled-'))
    try {
      const lower = framework.toLowerCase()
      const file = framework === 'Vue' ? 'Example.vue' : framework === 'Svelte' ? 'Example.svelte' : 'Example.tsx'
      await writeFile(join(folder, file), controlledSelectSnippet(framework).replace(`@destyler/ready-prototype/${lower}`, `${root}packages/ready/${lower}`))
      let plugin, runtime
      if (framework === 'React') { plugin = (await import('@vitejs/plugin-react')).default(); runtime = `import {createElement} from 'react';import {createRoot} from 'react-dom/client';export function run(target){const root=createRoot(target);root.render(createElement(Example));return()=>root.unmount()}` }
      if (framework === 'Vue') { plugin = (await import('@vitejs/plugin-vue')).default(); runtime = `import {createApp} from 'vue';export function run(target){const app=createApp(Example);app.mount(target);return()=>app.unmount()}` }
      if (framework === 'Solid') { plugin = (await import('vite-plugin-solid')).default(); runtime = `import {render} from 'solid-js/web';import {createComponent} from 'solid-js';export function run(target){return render(()=>createComponent(Example,{}),target)}` }
      if (framework === 'Svelte') { plugin = (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false}); runtime = `import {mount,unmount} from 'svelte';export function run(target){const app=mount(Example,{target});return()=>unmount(app)}` }
      const entry = join(folder, 'entry.mjs')
      await writeFile(entry, `import Example from './${file}';${runtime}`)
      const { build } = await import('vite')
      await build({ root, configFile:false, logLevel:'error', plugins:[plugin], build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}} })
      const output = execFileSync(process.execPath, [fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')], {cwd:root,encoding:'utf8',timeout:30000})
      assert.match(output, /PASS documented controlled Select/)
    } finally { await rm(folder, {recursive:true,force:true}) }
  })
}
