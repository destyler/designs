// Real documentation App and Ready components in Happy DOM; no browser or CSS geometry claim.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../', import.meta.url))

if (process.argv[2] === '--worker') {
  const { Window } = await import('happy-dom')
  const win = new Window({ url: 'http://localhost/ready/?framework=vue&from=share' })
  for (const key of Object.getOwnPropertyNames(win)) if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
    try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
  }
  for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
  globalThis.window = win; globalThis.document = win.document
  const target = document.createElement('div'); target.id = 'docs-test'; document.body.append(target)
  const { mountReadyDocs } = await import(pathToFileURL(process.argv[3]))
  const app = mountReadyDocs(target)
  const settle = () => new Promise(resolve => setTimeout(resolve, 100))
  await settle()
  const button = (text, scope = document) => [...scope.querySelectorAll('button')].find(node => node.textContent.trim() === text)
  const part = (family, name) => document.querySelector(`[data-scope="${family}"][data-part="${name}"]`)
  const click = async node => { assert.ok(node, 'Expected actionable element'); node.click(); await settle() }
  const associations = () => {
    for (const node of document.querySelectorAll('[aria-labelledby],[aria-describedby]')) for (const attribute of ['aria-labelledby', 'aria-describedby']) for (const id of (node.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) assert.ok(document.getElementById(id), `${attribute} target ${id} exists`)
  }
  for (const anchor of document.querySelectorAll('a[href^="#"]')) assert.ok(document.getElementById(anchor.getAttribute('href').slice(1)), 'Navigation points to an existing section')
  assert.equal(document.documentElement.dataset.appearance, 'light', 'New visits use the neutral light documentation appearance')
  const home = document.getElementById('overview')
  assert.equal(home.querySelector('iframe').getAttribute('src'), './previews/vue/select.html', 'Shared framework URL initializes native runtime')
  for (const framework of ['Vue', 'Solid', 'Svelte', 'React']) {
    await click(button(framework, home))
    assert.equal(new URL(window.location.href).searchParams.get('framework'), framework.toLowerCase())
    assert.equal(new URL(window.location.href).searchParams.get('from'), 'share', 'Framework change preserves unrelated URL parameters')
    assert.equal(home.querySelector('iframe').getAttribute('src'), `./previews/${framework.toLowerCase()}/select.html`, 'Homepage switches the actual native Select runtime')
  }
  for (const component of ['Checkbox', 'Dialog', 'Select']) {
    await click([...home.querySelectorAll('.home-component-picker button')].find(node => node.textContent.includes(component)))
    assert.equal(home.querySelector('iframe').getAttribute('src'), `./previews/react/${component.toLowerCase()}.html`)
    assert.match(home.querySelector('pre code').textContent, new RegExp(`<${component}`))
    assert.equal(home.querySelector('.home-component-picker a').getAttribute('href'), `#${component.toLowerCase()}`)
  }
  const retainedFrame = home.querySelector('iframe')
  await click(button('代码', home))
  assert.equal(home.querySelector('.home-source').hidden, false)
  assert.equal(home.querySelector('.home-live-stage').hidden, true)
  await click(button('预览', home))
  assert.equal(home.querySelector('.home-live-stage').hidden, false)
  assert.equal(home.querySelector('.home-source').hidden, true)
  assert.equal(home.querySelector('iframe'), retainedFrame, 'Preview/code toggle keeps interaction state')
  const homeFrame = home.querySelector('iframe')
  await click(button('Midnight', home))
  assert.equal(home.querySelector('iframe'), homeFrame, 'Theme switching preserves the mounted runtime')
  await click(button('Everyday', home))
  const toggle = document.querySelector('button[aria-label="打开导航"]')
  await click(toggle); assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.ok(document.querySelector('.sidebar').classList.contains('is-open'))
  await click(document.querySelector('nav a[href="#select"]')); assert.equal(toggle.getAttribute('aria-expanded'), 'false'); assert.equal(document.querySelector('.sidebar').classList.contains('is-open'), false)

  // Framework switching changes both the compiled native preview URL and its source.
  for (const framework of ['Vue', 'Solid', 'Svelte', 'React']) {
    await click(button(framework, document.querySelector('#installation')))
    for (const section of ['checkbox', 'select', 'dialog']) {
      window.location.hash=section;window.dispatchEvent(new win.Event('hashchange'));await settle();
      const scope = document.getElementById(section)
      assert.match(scope.querySelector('pre code').textContent, new RegExp(`@destyler/ready-prototype/${framework.toLowerCase()}`))
      assert.equal(button(framework, scope).getAttribute('aria-pressed'), 'true')
      assert.ok(scope.querySelector('.preview-footer').textContent.includes(framework)); assert.equal(scope.querySelector('iframe').getAttribute('src'), `./previews/${framework.toLowerCase()}/${section}.html`)
      const table = scope.querySelector('table').textContent
      const prop = {checkbox:'checked',select:'value',dialog:'open'}[section]
      const event = {checkbox:'Checked',select:'Value',dialog:'Open'}[section]
      if (framework === 'Vue') { assert.ok(table.includes(`update:${prop}`)); assert.ok(table.includes(`${prop}Change`)); assert.ok(!table.includes(`on${event}Change`)) }
      else assert.ok(table.includes(`on${event}Change`))
      assert.match(scope.querySelector('.usage-panel .api-note').textContent, /非受控/)

    }
    assert.match(document.querySelector('#installation pre code').textContent, new RegExp(`framework=${framework.toLowerCase()}`))
    const controlled = document.querySelector('[data-doc-example="controlled-select"] pre code').textContent
    assert.ok(controlled.includes(`@destyler/ready-prototype/${framework.toLowerCase()}`))
    assert.match(controlled, /清空选择/)
    assert.ok(controlled.includes(framework === 'Vue' ? 'v-model:value="value"' : 'onValueChange='))
    assert.doesNotMatch(controlled, /bind:value/)

  }

  window.location.hash='select';window.dispatchEvent(new win.Event('hashchange'));await settle();
  await click(document.querySelector('.skip-link')); assert.equal(document.querySelector('main').dataset.page,'select','Skip link preserves current route'); assert.equal(document.activeElement.id,'main-content');
  await click(document.querySelector('.search-trigger')); assert.ok(document.querySelector('[role=dialog]')); assert.equal(document.activeElement.getAttribute('aria-label'),'搜索关键词');
  const searchInput = document.querySelector('input[aria-label="搜索关键词"]')
  const inputValue = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
  inputValue.call(searchInput, '受控'); searchInput.dispatchEvent(new win.Event('input', { bubbles: true })); await settle()
  assert.ok(document.querySelector('.search-results a[href="#select"]'), 'Controlled keyword finds the actual Select page')
  assert.equal(document.querySelector('.search-results a').textContent.includes('Select'), true)
  window.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape'}));await settle();assert.equal(document.querySelector('.search-dialog'),null);assert.equal(document.activeElement,document.querySelector('.search-trigger'));
  await click(toggle);window.dispatchEvent(new win.KeyboardEvent('keydown',{key:'k',ctrlKey:true}));await settle();assert.ok(document.querySelector('.search-dialog'));assert.equal(document.querySelector('.sidebar').classList.contains('is-open'),false);window.dispatchEvent(new win.KeyboardEvent('keydown',{key:'k',ctrlKey:true}));await settle();assert.equal(document.querySelector('.search-dialog'),null);assert.equal(document.activeElement,document.querySelector('.search-trigger'));
  await click(document.querySelector('.appearance-button'));assert.equal(document.documentElement.dataset.appearance,'dark');
  await click(document.querySelector('.appearance-button'));assert.equal(document.documentElement.dataset.appearance,'light');
  assert.ok(document.querySelector('#select details').open,'API is expanded by default');
  assert.match(document.title,/Select/);
  const disabledNote = document.querySelector('#select [data-doc-note="disabled-selection"]')
  assert.ok(disabledNote && !disabledNote.closest('details'), 'Select submission caveat is visible without expanding API details')
  assert.match(disabledNote.textContent, /仍会显示并保留选中状态/)
  assert.match(disabledNote.textContent, /禁用选项不会作为该字段的提交值/)
  assert.match(disabledNote.textContent, /不要依赖 required/)
  assert.match(disabledNote.textContent, /Happy DOM.*浏览器不同/)
  const nativeNote = document.querySelector('#boundaries [data-doc-note="native-attributes"]')
  assert.match(nativeNote.textContent, /不保证任意原生属性转发/)
  assert.match(nativeNote.textContent, /Vue.*外层包装元素.*内部原生输入或 Select 触发器/)
  assert.match(nativeNote.textContent, /没有通用原生属性转发 API/)

  let written, finishCopy
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => { written = text; return new Promise(resolve => { finishCopy = resolve }) } } })
  const copy = document.querySelector('#checkbox button[aria-label^="复制"]')
  copy.click(); await settle(); assert.equal(copy.textContent, '复制代码 ↗', 'Success waits for clipboard resolution')
  assert.equal(written, document.querySelector('#checkbox pre code').textContent)
  finishCopy(); await settle(); assert.equal(copy.textContent, '已复制 ✓')
  await click(button('Vue', document.getElementById('checkbox'))); assert.equal(copy.textContent, '复制代码 ↗', 'New code resets stale copy feedback')
  // A pending clipboard response must not annotate a newer framework snippet.
  copy.click(); await settle()
  await click(button('Solid', document.getElementById('checkbox')))
  finishCopy(); await settle(); assert.equal(copy.textContent, '复制代码 ↗', 'Old completion is ignored after framework change')
  // Repeated copies use only the newest response, including out-of-order rejection.
  const pending = []
  navigator.clipboard.writeText = () => new Promise((resolve,reject) => pending.push({resolve,reject}))
  copy.click(); copy.click(); await settle()
  pending[1].resolve(); await settle(); assert.equal(copy.textContent, '已复制 ✓')
  pending[0].reject(new Error('stale failure')); await settle(); assert.equal(copy.textContent, '已复制 ✓')
  navigator.clipboard.writeText = async () => { throw new Error('Clipboard denied in simulated test') }
  await click(copy); assert.match(copy.textContent, /复制失败/)
  assert.match(document.querySelector('#checkbox .code-block [role="status"]').textContent, /无法访问剪贴板/)

  await click(button('React', document.getElementById('installation')))
  window.location.hash='checkbox';window.dispatchEvent(new win.Event('hashchange'));await settle();
  const originalFrame=document.querySelector('#checkbox iframe')
  await click(button('Midnight', document.querySelector('.theme-switch')))
  assert.equal(document.querySelector('#checkbox iframe'),originalFrame,'Theme switch preserves the runtime')
  assert.equal(document.querySelector('#checkbox .preview-panel').dataset.rdTheme,'midnight')
  await click(button('Vue', document.getElementById('installation')))
  assert.notEqual(document.querySelector('#checkbox iframe'),originalFrame,'Framework switch unmounts previous runtime')
  const newFrame=document.querySelector('#checkbox iframe')
  window.dispatchEvent(new win.MessageEvent('message',{origin:window.location.origin,source:newFrame.contentWindow,data:{type:'ready-docs:ready',framework:'React',component:'checkbox'}}))
  await settle(); assert.ok(document.querySelector('#checkbox .frame-status'),'Stale framework messages ignored')
  window.dispatchEvent(new win.MessageEvent('message',{origin:window.location.origin,source:newFrame.contentWindow,data:{type:'ready-docs:ready',framework:'Vue',component:'checkbox'}}))
  await settle(); assert.equal(document.querySelector('#checkbox .frame-status'),null,'Current native frame readiness accepted')
  window.location.hash='dialog';window.dispatchEvent(new win.Event('hashchange'));await settle()
  assert.equal(document.querySelector('main').dataset.page,'dialog')
  await click(button('代码',document.querySelector('#dialog')))
  assert.equal(document.querySelector('#dialog .preview-panel').hidden,true)
  assert.equal(document.querySelector('#dialog .usage-panel').hidden,false)
  await click(button('预览',document.querySelector('#dialog')))
  assert.equal(document.querySelector('#dialog .preview-panel').hidden,false)
  window.location.hash='not-a-page';window.dispatchEvent(new win.Event('hashchange'));await settle();assert.equal(document.querySelector('main').dataset.page,'overview');
  window.location.hash='themes';window.dispatchEvent(new win.Event('hashchange'));await settle()
  const themePage = document.getElementById('themes')
  const themeFrame = themePage.querySelector('iframe')
  assert.ok(themeFrame, 'Theme page mounts a real component preview')
  const docAppearance = document.documentElement.dataset.appearance
  await click(themePage.querySelector('.dark-card'))
  assert.equal(themePage.querySelector('.preview-panel').dataset.rdTheme, 'midnight')
  assert.equal(themePage.querySelector('iframe'), themeFrame, 'Changing component theme retains the native frame')
  assert.equal(document.documentElement.dataset.appearance, docAppearance, 'Component theme does not change document appearance')
  await click(document.querySelector('.appearance-button'))
  assert.equal(themePage.querySelector('.preview-panel').dataset.rdTheme, 'midnight', 'Document appearance does not change component theme')
  await click(themePage.querySelector('.light-card'))
  assert.equal(themePage.querySelector('.preview-panel').dataset.rdTheme, 'default')
  assert.equal(themePage.querySelector('iframe'), themeFrame)
  for (const framework of ['React', 'Vue', 'Solid', 'Svelte']) {
    await click(button(framework, themePage))
    assert.equal(themePage.querySelector('iframe').getAttribute('src'), `./previews/${framework.toLowerCase()}/select.html`)
  }
  window.history.replaceState(null, '', '/ready/?framework=solid&from=share#dialog')
  window.dispatchEvent(new win.PopStateEvent('popstate')); await settle()
  assert.equal(document.querySelector('main').dataset.page, 'dialog')
  assert.equal(document.querySelector('#dialog iframe').getAttribute('src'), './previews/solid/dialog.html', 'History navigation restores actual runtime and page')
  await app.unmount()
  const refreshed = mountReadyDocs(target); await settle()
  assert.equal(document.querySelector('#dialog iframe').getAttribute('src'), './previews/solid/dialog.html', 'Fresh mount restores the shared page and framework')
  await refreshed.unmount(); await win.happyDOM.close()
  console.log('PASS ready docs navigation, framework code, copy, theme, Checkbox, Select and Dialog')
} else {
  test('Ready documentation switches native preview lifecycles, themes, source and navigation', { timeout: 120000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-docs-test-'))
    try {
      const entry = join(folder, 'entry.mjs')
      await writeFile(entry, `export { mountReadyDocs } from '${root}examples/ready-docs/main.tsx';`)
      const { build } = await import('vite'); const react = (await import('@vitejs/plugin-react')).default
      await build({ root, configFile: false, logLevel: 'error', plugins: [react()], build: { outDir: join(folder, 'out'), minify: false, lib: { entry, formats: ['es'], fileName: () => 'docs.mjs' } } })
      const output = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', join(folder, 'out/docs.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.match(output, /PASS ready docs navigation/)
    } finally { await rm(folder, { recursive: true, force: true }) }
  })
  test('Ready documentation snippets preserve the private package and framework contract', async () => {
    const { snippet, controlledSelectSnippet, install, frameworks, themeSnippets } = await import('../examples/ready-docs/content.ts')
    for (const framework of frameworks) {
      const controlled = controlledSelectSnippet(framework)
      assert.match(controlled, /type="button"/)
      assert.ok(controlled.includes(framework === 'Vue' || framework === 'Svelte' ? "value = ''" : "setValue('')"))
      assert.ok(controlled.includes(framework === 'Solid' ? 'value()' : 'value'))
      const commands = install(framework)
      assert.match(commands, /npm pack \.\/packages\/ready/)
      assert.match(commands, /scripts\/create-ready-consumer\.mjs/)
      assert.match(commands, /npm install[\s\S]*npm run dev/)
      assert.ok(commands.split('\n').length > 5)
      for (const component of ['Checkbox', 'Select', 'Dialog']) {
        const code = snippet(framework, component)
        assert.ok(code.includes(`@destyler/ready-prototype/${framework.toLowerCase()}`))
        assert.ok(code.includes(`<${component}`)); assert.ok(code.includes('\n'))
        assert.ok(code.split('\n').every(line => line.length <= 80), 'Basic examples use readable source lines, not minified markup')
        assert.match(code, new RegExp(`<${component}\\n`), 'Component attributes start on separate lines')
        if (framework === 'Svelte') assert.doesNotMatch(code, /bind:(checked|value|open)/)
      }
    }
    assert.equal(themeSnippets.length, 3)
    assert.match(themeSnippets[0].code, /^import /)
    assert.doesNotMatch(themeSnippets[0].code, /<main|--rd-accent/)
    assert.match(themeSnippets[1].code, /\[data-rd-theme\]\.my-theme/)
    assert.doesNotMatch(themeSnippets[1].code, /import |<main/)
    assert.match(themeSnippets[2].code, /id="app"/)
    assert.doesNotMatch(themeSnippets[2].code, /className|import /)
    const source = await readFile(join(root, 'examples/ready-docs/main.tsx'), 'utf8')
    assert.match(source, /22\.22\.3/)
    assert.match(source, /app.config.idPrefix/)
    assert.match(source, /水合前.*丢失或错配/)
    assert.match(source, /Escape[\s\S]*同时关闭两层/)
    assert.match(source, /packages\/ready\/theme\.css/)
  })

  test('Ready docs URL framework contract preserves route, parameters and fallback', async () => {
    const { frameworkFromUrl, urlWithFramework } = await import('../examples/ready-docs/content.ts')
    for (const [query, expected] of [['vue','Vue'],['SOLID','Solid'],['svelte','Svelte'],['react','React'],['unknown','React'],['','React']]) assert.equal(frameworkFromUrl(`https://example.com/docs?framework=${query}#select`), expected)
    const shared = new URL(urlWithFramework('https://example.com/docs?from=email#dialog', 'Vue'))
    assert.equal(shared.searchParams.get('framework'), 'vue'); assert.equal(shared.searchParams.get('from'), 'email'); assert.equal(shared.hash, '#dialog'); assert.equal(shared.pathname, '/docs')
  })
  test('Existing Vite instructions match actual pinned framework peers and compiler versions', async () => {
    const { consumerSetup, existingInstall, frameworks } = await import('../examples/ready-docs/content.ts')
    const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    const ready = JSON.parse(await readFile(join(root, 'packages/ready/package.json'), 'utf8'))
    for (const framework of frameworks) {
      const setup = consumerSetup[framework], code = existingInstall(framework)
      const peers = setup.peers.split(' ')
      assert.ok(peers.includes(`@destyler-ui/${framework.toLowerCase()}@0.0.5`))
      for (const dependency of [...peers, setup.plugin]) {
        const split = dependency.lastIndexOf('@'), name = dependency.slice(0,split), version = dependency.slice(split+1)
        assert.equal(manifest.dependencies?.[name] ?? manifest.devDependencies?.[name], version)
        if (peers.includes(dependency)) assert.ok(ready.peerDependencies[name], `${name} is a real runtime peer`)
      }
      assert.match(code, /npm pack \.\/packages\/ready/)
      assert.match(code, /npm install "\.\/vendor\/destyler\/\$revision\/destyler-ready-prototype-0\.0\.0\.tgz"/)
      assert.doesNotMatch(code, /mktemp|archive_dir=".*\/tmp/)
      assert.doesNotMatch(code, /npm install @destyler\/ready-prototype/)
      assert.match(setup.config, /plugins:/)
    }
    const source = await readFile(join(root, 'examples/ready-docs/main.tsx'), 'utf8')
    assert.match(source, /data-doc-existing-project/)
    assert.match(source, /data-doc-note="tarball-reinstall"/)
    assert.match(source, /相同相对路径、相同字节/)
    assert.match(source, /import '@destyler\/ready-prototype\/theme\.css'/)
    assert.match(source, /尚未发布/)
  })

  test('Documentation keyword search normalizes input and only returns real page routes', async () => {
    const { searchDocumentation, documentationPages } = await import('../examples/ready-docs/content.ts')
    const ids = query => searchDocumentation(query).map(page => page.id)
    assert.deepEqual(ids('受控'), ['select'])
    assert.deepEqual(ids(' 清空 '), ['select'])
    assert.deepEqual(ids('  SELECT   controlled '), ['select'])
    assert.deepEqual(ids('ＳＥＬＥＣＴ'), ['select'])
    assert.deepEqual(ids('安装'), ['installation'])
    assert.deepEqual(ids('VITE peer'), ['installation'])
    assert.deepEqual(ids('对话框'), ['dialog'])
    assert.deepEqual(ids('复选框'), ['checkbox'])
    assert.ok(ids('CSS').includes('themes'))
    assert.deepEqual(ids('definitely-unindexed-term'), [])
    assert.deepEqual(ids('RTL'), [], 'Do not index topics that are absent from the destination page')
    assert.equal(ids('   ').length, documentationPages.length)
    const source = await readFile(join(root, 'examples/ready-docs/main.tsx'), 'utf8')
    for (const page of documentationPages) assert.ok(['overview','installation','checkbox','select','dialog','themes','boundaries'].includes(page.id))
    assert.match(source, /searchResults\.map/)
    assert.match(source, /searchResults\.length === 0/)
  })

  test('Ready docs current picker palette meets normal-text contrast (source calculation)', async () => {
    const css = await readFile(join(root, 'examples/ready-docs/styles.css'), 'utf8')
    assert.match(css, /\.frameworks button\s*\{\s*color:\s*var\(--muted\)/); assert.match(css, /:root\[data-appearance="dark"\]/)
    const luminance = hex => {
      const rgb = hex.replace('#','').match(/../g).map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4)
      return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722
    }
    const palettes = [...css.matchAll(/:root(?:\[data-appearance="dark"\])?\s*\{([^}]+)\}/g)].map(match => Object.fromEntries([...match[1].matchAll(/--(paper|surface|ink|muted):\s*(#[0-9a-f]{6})/g)].map(entry => [entry[1], entry[2]]))).filter(palette => palette.paper)
    assert.equal(palettes.length, 2, 'Both actual theme palettes are measured')
    for (const palette of palettes) for (const foreground of [palette.ink, palette.muted]) for (const background of [palette.paper, palette.surface]) {
      const levels = [luminance(foreground), luminance(background)].sort((a,b)=>b-a)
      assert.ok((levels[0]+.05)/(levels[1]+.05) >= 4.5, `${foreground} on ${background}`)
    }
    assert.match(css, /button:focus-visible[^}]+outline:\s*2px/)
  })
}
