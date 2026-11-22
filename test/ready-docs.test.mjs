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
  const click = async node => { assert.ok(node, 'Expected actionable element'); node.click(); await settle() }
  const associations = () => {
    for (const node of document.querySelectorAll('[aria-labelledby],[aria-describedby]')) for (const attribute of ['aria-labelledby', 'aria-describedby']) for (const id of (node.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) assert.ok(document.getElementById(id), `${attribute} target ${id} exists`)
  }
  const navigate = async hash => {
    window.location.hash = hash
    window.dispatchEvent(new win.Event('hashchange'))
    await settle()
  }
  const main = () => document.querySelector('main')
  const modal = name => document.querySelector(`dialog.${name}-dialog`)
  const pickTheme = async (scope, theme) => {
    const select = scope.querySelector('.theme-control select')
    assert.ok(select, 'Theme control is present')
    select.value = theme
    select.dispatchEvent(new win.Event('change', {bubbles:true}))
    await settle()
  }
  assert.equal(document.documentElement.dataset.appearance, 'light', 'New visits use the neutral light documentation appearance')
  assert.equal(main().dataset.page, 'overview')
  assert.equal(main().querySelectorAll('h1').length, 1)
  assert.equal(main().querySelector('iframe'), null, 'The editorial home has no live runtime; component pages own previews')
  assert.deepEqual([...main().querySelectorAll('.specimens a')].map(node => node.getAttribute('href')), ['#checkbox', '#select', '#dialog'])
  await click(main().querySelector('a[href="#overview/components"]'))
  assert.equal(main().dataset.page, 'overview')
  assert.ok(main().querySelector('#components'))
  assert.equal(window.location.hash, '#overview/components')
  const toggle = document.querySelector('button[aria-label="打开导航"]')
  await click(toggle)
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  assert.equal(modal('mobile').open, true)
  await click(modal('mobile').querySelector('a[href="#select"]'))
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(modal('mobile').open, false)
  assert.equal(main().dataset.page, 'select')
  assert.equal(main().querySelector('#select iframe').getAttribute('src'), './previews/vue/select.html', 'Shared framework URL initializes native runtime')
  assert.equal(main().querySelector('h1').textContent, 'Select')
  assert.equal(document.getElementById('checkbox'), null, 'Inactive route content is not mounted')
  associations()

  // Framework switching changes each compiled native preview URL and its source.
  for (const framework of ['Vue', 'Solid', 'Svelte', 'React']) {
    await navigate('installation')
    const guide = main()
    await click(button(framework, guide))
    assert.equal(new URL(window.location.href).searchParams.get('framework'), framework.toLowerCase())
    assert.equal(new URL(window.location.href).searchParams.get('from'), 'share', 'Framework change preserves unrelated URL parameters')
    assert.match(guide.querySelector('#new-project pre code').textContent, new RegExp(`framework=${framework.toLowerCase()}`))
    for (const section of ['checkbox', 'select', 'dialog']) {
      await navigate(section)
      const scope = document.getElementById(section)
      assert.match(scope.querySelector('.usage-panel pre code').textContent, new RegExp(`@destyler/ready-prototype/${framework.toLowerCase()}`))
      assert.equal(button(framework, scope).getAttribute('aria-pressed'), 'true')
      assert.match(scope.querySelector('.example-meta').textContent, new RegExp(framework))
      assert.equal(scope.querySelector('iframe').getAttribute('src'), `./previews/${framework.toLowerCase()}/${section}.html`)
      const table = scope.querySelector('table').textContent
      const prop = {checkbox:'checked',select:'value',dialog:'open'}[section]
      const event = {checkbox:'Checked',select:'Value',dialog:'Open'}[section]
      if (framework === 'Vue') { assert.ok(table.includes(`update:${prop}`)); assert.ok(table.includes(`${prop}Change`)); assert.ok(!table.includes(`on${event}Change`)) }
      else assert.ok(table.includes(`on${event}Change`))
      assert.match(scope.querySelector('#api').textContent, /省略值属性时由组件管理状态/)
      if (section === 'select') {
        const controlled = scope.querySelector('[data-doc-example="controlled-select"] pre code').textContent
        assert.ok(controlled.includes(`@destyler/ready-prototype/${framework.toLowerCase()}`))
        assert.match(controlled, /清空选择/)
        assert.ok(controlled.includes(framework === 'Vue' ? 'v-model:value="value"' : 'onValueChange='))
        assert.doesNotMatch(controlled, /bind:value/)
      }
    }
  }

  window.location.hash='select';window.dispatchEvent(new win.Event('hashchange'));await settle();
  await click(document.querySelector('.skip-link')); assert.equal(document.querySelector('main').dataset.page,'select','Skip link preserves current route'); assert.equal(document.activeElement.id,'main-content');
  await click(document.querySelector('.search-trigger')); assert.equal(modal('search').open, true)
  const searchInput = document.querySelector('input[aria-label="搜索关键词"]')
  assert.ok(searchInput, 'Native search dialog contains a named search input')
  assert.equal(document.activeElement, searchInput, 'Opening search focuses its input')
  const inputValue = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
  inputValue.call(searchInput, '受控'); searchInput.dispatchEvent(new win.Event('input', { bubbles: true })); await settle()
  assert.ok(document.querySelector('.search-results a[href="#select"]'), 'Controlled keyword finds the actual Select page')
  assert.equal(document.querySelector('.search-results a').textContent.includes('Select'), true)
  modal('search').dispatchEvent(new win.Event('cancel', {cancelable: true}))
  await settle(); assert.equal(modal('search').open, false); assert.equal(document.activeElement, document.querySelector('.search-trigger'))
  await click(toggle)
  window.dispatchEvent(new win.KeyboardEvent('keydown',{key:'k',ctrlKey:true}))
  await settle(); assert.equal(modal('search').open, true); assert.equal(modal('mobile').open, false)
  window.dispatchEvent(new win.KeyboardEvent('keydown',{key:'k',ctrlKey:true}))
  await settle(); assert.equal(modal('search').open, false); assert.equal(document.activeElement, document.querySelector('.search-trigger'))
  const appearance = () => document.querySelector('.site-header button[aria-label^="切换"]')
  await click(appearance()); assert.equal(document.documentElement.dataset.appearance,'dark')
  await click(appearance()); assert.equal(document.documentElement.dataset.appearance,'light')
  assert.ok(document.querySelector('#select #api table'), 'API is visible with no disclosure to open')
  assert.match(document.title,/Select/)
  const disabledNote = document.querySelector('#select [data-doc-note="disabled-selection"]')
  assert.ok(disabledNote && !disabledNote.closest('details'), 'Select submission caveat is visible without expanding API details')
  assert.match(disabledNote.textContent, /界面仍保留/)
  assert.match(disabledNote.textContent, /原生表单不会提交该值/)
  assert.match(disabledNote.textContent, /不要依赖\s*required/)
  assert.match(disabledNote.textContent, /Happy DOM[\s\S]*浏览器/)
  await click(document.querySelector('.toc a[href="#select/controlled"]'))
  assert.equal(main().dataset.page, 'select')
  assert.equal(window.location.hash, '#select/controlled')
  assert.equal(document.querySelector('.toc a[href="#select/controlled"]').getAttribute('aria-current'), 'location')
  assert.ok(main().querySelector('#controlled'))

  await navigate('boundaries')
  const nativeNote = main().querySelector('[data-doc-note="native-attributes"]')
  assert.match(nativeNote.textContent, /只支持文档列出的组件属性/)
  assert.match(nativeNote.textContent, /Vue.*外层元素.*内部原生输入或 Select 触发器/)
  assert.match(main().querySelector('#forms').textContent, /水合前.*丢失或错配/)
  assert.match(main().querySelector('#overlays').textContent, /Escape[\s\S]*同时关闭两层/)
  assert.match(main().querySelector('#verification').textContent, /不等于完整的真实浏览器/)

  await navigate('checkbox')
  const checkbox = document.getElementById('checkbox')
  const retainedFrame = checkbox.querySelector('iframe')
  await click(button('代码', checkbox))
  assert.equal(checkbox.querySelector('.preview-panel').hidden, true)
  assert.equal(checkbox.querySelector('.usage-panel').hidden, false)
  await click(button('预览', checkbox))
  assert.equal(checkbox.querySelector('.preview-panel').hidden, false)
  assert.equal(checkbox.querySelector('.usage-panel').hidden, true)
  assert.equal(checkbox.querySelector('iframe'), retainedFrame, 'Preview/code toggle keeps interaction state')
  await click(button('代码', checkbox))
  let written, finishCopy
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => { written = text; return new Promise(resolve => { finishCopy = resolve }) } } })
  const copy = document.querySelector('#checkbox .usage-panel button[aria-label^="复制"]')
  copy.click(); await settle(); assert.equal(copy.textContent, '复制代码 ↗', 'Success waits for clipboard resolution')
  assert.equal(written, document.querySelector('#checkbox .usage-panel pre code').textContent)
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
  assert.match(document.querySelector('#checkbox .usage-panel [role="status"]').textContent, /无法访问剪贴板/)

  await click(button('React', checkbox))
  await click(button('预览', checkbox))
  const originalFrame=document.querySelector('#checkbox iframe')
  await pickTheme(checkbox, 'midnight')
  assert.equal(document.querySelector('#checkbox iframe'),originalFrame,'Theme switch preserves the runtime')
  assert.equal(document.querySelector('#checkbox .preview-panel').dataset.rdTheme,'midnight')
  await click(button('Vue', checkbox))
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
  const themePage = main()
  const themeFrame = themePage.querySelector('iframe')
  assert.ok(themeFrame, 'Theme page mounts a real component preview')
  const docAppearance = document.documentElement.dataset.appearance
  await pickTheme(themePage, 'default')
  await pickTheme(themePage, 'midnight')
  assert.equal(themePage.querySelector('.preview-panel').dataset.rdTheme, 'midnight')
  assert.equal(themePage.querySelector('iframe'), themeFrame, 'Changing component theme retains the native frame')
  assert.equal(document.documentElement.dataset.appearance, docAppearance, 'Component theme does not change document appearance')
  await click(appearance())
  assert.equal(themePage.querySelector('.preview-panel').dataset.rdTheme, 'midnight', 'Document appearance does not change component theme')
  await pickTheme(themePage, 'default')
  assert.equal(themePage.querySelector('.preview-panel').dataset.rdTheme, 'default')
  assert.equal(themePage.querySelector('iframe'), themeFrame)
  for (const framework of ['React', 'Vue', 'Solid', 'Svelte']) {
    await click(button(framework, themePage))
    assert.equal(themePage.querySelector('iframe').getAttribute('src'), `./previews/${framework.toLowerCase()}/select.html`)
  }
  window.history.replaceState(null, '', '/ready/?framework=solid&from=share#dialog/api')
  window.dispatchEvent(new win.PopStateEvent('popstate')); await settle()
  assert.equal(document.querySelector('main').dataset.page, 'dialog')
  assert.equal(document.querySelector('#dialog iframe').getAttribute('src'), './previews/solid/dialog.html', 'History navigation restores actual runtime and page')
  assert.equal(document.querySelector('.toc a[href="#dialog/api"]').getAttribute('aria-current'), 'location')
  await app.unmount()
  const refreshed = mountReadyDocs(target); await settle()
  assert.equal(document.querySelector('#dialog iframe').getAttribute('src'), './previews/solid/dialog.html', 'Fresh mount restores the shared page and framework')
  assert.equal(document.querySelector('.toc a[href="#dialog/api"]').getAttribute('aria-current'), 'location', 'Fresh mount restores subsection')
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
    const guides = await readFile(join(root, 'examples/ready-docs/Guides.tsx'), 'utf8')
    assert.match(guides, /22\.22\.3/)
    assert.match(guides, /app.config.idPrefix/)
    assert.match(guides, /水合前.*丢失或错配/)
    assert.match(guides, /Escape[\s\S]*同时关闭两层/)
    assert.match(source, /packages\/ready\/theme\.css/)
  })

  test('Ready docs URL framework contract preserves route, parameters and fallback', async () => {
    const { frameworkFromUrl, urlWithFramework } = await import('../examples/ready-docs/content.ts')
    for (const [query, expected] of [['vue','Vue'],['SOLID','Solid'],['svelte','Svelte'],['react','React'],['unknown','React'],['','React']]) assert.equal(frameworkFromUrl(`https://example.com/docs?framework=${query}#select`), expected)
    const shared = new URL(urlWithFramework('https://example.com/docs?from=email#dialog', 'Vue'))
    assert.equal(shared.searchParams.get('framework'), 'vue'); assert.equal(shared.searchParams.get('from'), 'email'); assert.equal(shared.hash, '#dialog'); assert.equal(shared.pathname, '/docs')
  })
  test('Existing Vite instructions match actual pinned framework peers and compiler versions', async () => {
    const { consumerSetup, existingInstall, optionalCompilerInstall, frameworks } = await import('../examples/ready-docs/content.ts')
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
      assert.doesNotMatch(code, /npm install\s+-D\b/)
      assert.ok(code.endsWith(setup.peers))
      assert.equal(optionalCompilerInstall(framework), `npm install -D ${setup.plugin}`)
      assert.match(setup.config, /plugins:/)
    }
    const source = await readFile(join(root, 'examples/ready-docs/Guides.tsx'), 'utf8')
    assert.match(source, /data-doc-existing-project/)
    assert.match(source, /确认框架编译器[\s\S]*optionalCompilerInstall\(framework\)[\s\S]*仅缺少 Vite 插件时安装/)
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
    assert.match(source, /results\.map/)
    assert.match(source, /results\.length\s*===\s*0/)
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
