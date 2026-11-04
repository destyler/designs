import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Window } from 'happy-dom'
const window = new Window({ url:'http://localhost:4173/examples/shadcn/#settings', settings:{ disableCSSFileLoading:true, disableComputedStyleRendering:true } })
for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','Element','Node','NodeFilter','Event','CustomEvent','MouseEvent','KeyboardEvent','MutationObserver','ResizeObserver','IntersectionObserver','SVGElement','DocumentFragment','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) {
  const value = key==='window' ? window : typeof window[key] === 'function' && ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(key) ? window[key].bind(window) : window[key]
  Object.defineProperty(globalThis,key,{configurable:true,value})
}
for (const key of Object.getOwnPropertyNames(window)) {
  if (/^(HTML.*Element|SVG.*Element|Document|ShadowRoot|CSS.*|Node.*)$/.test(key) && !(key in globalThis)) Object.defineProperty(globalThis,key,{configurable:true,value:window[key]})
}
window.document.body.innerHTML='<div id="app"></div>'
const html=await readFile('dist/examples/shadcn/index.html','utf8')
const entry=[...html.matchAll(/src="(\/assets\/[^\"]+\.js)"/g)].at(-1)[1]
await import(new URL('../dist'+entry,import.meta.url))
const settle=()=>new Promise(r=>setTimeout(r,100))
await settle()
const framework = document.querySelector('select[aria-label="Destyler framework"]')
assert.ok(framework, 'Framework selector mounts')
const reference = document.querySelector('.demo-panel[data-demo="reference"]')
assert.ok(reference, 'Reference mounts')
for(const name of ['reference','react','vue','react','vue']) {
  if(name !== 'reference') {
    framework.value=name
    framework.dispatchEvent(new window.Event('change',{bubbles:true}))
    await settle()
    assert.equal(document.querySelectorAll('.demo-panel').length,2,'Only two demo panels mount')
    assert.equal(document.querySelector(`.demo-panel[data-demo="${name==='react'?'vue':'react'}"]`),null,'Inactive framework unmounts')
    assert.equal(document.querySelector('.demo-panel[data-demo="reference"]'),reference,'Reference instance persists')
  }
  const root=document.querySelector(`[data-demo="${name}"]`)
  assert.ok(root, name)
  assert.equal(root.querySelectorAll('[role=tab]').length,2,`${name}: tabs mount`)
  const nativeInputs=root.querySelectorAll('input[type=checkbox]')
  if(name!=='reference') assert.ok(nativeInputs.length>=3, `${name}: real hidden inputs mount`)
  assert.ok(root.textContent.includes('Marketing emails'),`${name}: card mounts`)
  const marketing=name==='reference' ? root.querySelector('[role=switch]') : root.querySelector('input[role=switch]')
  assert.ok(marketing,`${name}: switch exists`)
  marketing.click(); await settle()
  assert.ok(marketing.checked || marketing.getAttribute('aria-checked')==='true',`${name}: switch changes`)
  const tab=root.querySelectorAll('[role=tab]')[1]
  tab.dispatchEvent(new window.MouseEvent('mousedown',{bubbles:true,button:0})); tab.click(); await settle()
  assert.equal(tab.getAttribute('aria-selected'),'true',`${name}: tab changes`)
  const first=root.querySelectorAll('[role=tab]')[0]; first.dispatchEvent(new window.MouseEvent('mousedown',{bubbles:true,button:0})); first.click(); await settle()
}
const inspectorToggle=[...document.querySelectorAll('[role="tab"]')].find(el=>el.textContent.trim()==='Code')
const previewToggle=[...document.querySelectorAll('[role="tab"]')].find(el=>el.textContent.trim()==='Preview')
assert.ok(inspectorToggle && previewToggle,'Preview/Code tabs mount')
assert.equal(inspectorToggle.getAttribute('aria-selected'),'false')
const retainedPanels=[...document.querySelectorAll('.demo-panel')]
inspectorToggle.click(); await settle()
assert.equal(inspectorToggle.getAttribute('aria-selected'),'true')
assert.deepEqual([...document.querySelectorAll('.demo-panel')],retainedPanels,'Code preserves mounted preview instances')
const inspector=document.querySelector('#css-inspector')
assert.ok(inspector,'Code source renders on demand')
const sourceText=()=>inspector.querySelector('[data-testid="css-source"]').textContent
const sourceTabs=[...inspector.querySelectorAll('[role="tab"]')]
const tokensTab=sourceTabs.find(tab=>tab.textContent==='Theme tokens')
tokensTab.click(); await settle()
assert.equal(sourceText(),await readFile('examples/shadcn/styles/tokens.css','utf8'),'Token view contains the actual source bytes')
for(const [key,expectedIndex] of [['Home',0],['ArrowLeft',sourceTabs.length-1],['Home',0],['End',sourceTabs.length-1],['ArrowRight',0]]) {
  const selected=sourceTabs.find(tab=>tab.getAttribute('aria-selected')==='true')
  selected.focus()
  selected.dispatchEvent(new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))
  await settle()
  assert.equal(sourceTabs[expectedIndex].getAttribute('aria-selected'),'true',`Inspector ${key}: selection moves`)
  assert.equal(document.activeElement,sourceTabs[expectedIndex],`Inspector ${key}: focus moves`)
  assert.equal(inspector.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby'),sourceTabs[expectedIndex].id,'Source panel label tracks the selected tab')
  assert.equal(sourceTabs.filter(tab=>tab.tabIndex===0).length,1,'Only the active source tab is tabbable')
}
previewToggle.click(); await settle()
assert.equal(previewToggle.getAttribute('aria-selected'),'true','Preview tab restores the preview')
assert.equal(inspectorToggle.getAttribute('aria-selected'),'false','Preview resets Code selection')
assert.deepEqual([...document.querySelectorAll('.demo-panel')],retainedPanels,'Returning to Preview retains component state')
for(const [from,key,to] of [[previewToggle,'ArrowRight',inspectorToggle],[inspectorToggle,'ArrowLeft',previewToggle],[previewToggle,'End',inspectorToggle],[inspectorToggle,'Home',previewToggle]]) {
  from.focus()
  from.dispatchEvent(new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))
  await settle()
  assert.equal(to.getAttribute('aria-selected'),'true',`View tab ${key}: selection moves`)
  assert.equal(document.activeElement,to,`View tab ${key}: focus moves`)
  assert.equal(to.tabIndex,0,'Selected view is tabbable')
  assert.equal(from.tabIndex,-1,'Inactive view is excluded from tab sequence')
  assert.equal(document.getElementById('preview-panel').hidden,to===inspectorToggle,'Code hides the preview panel')
  assert.equal(document.getElementById(to.getAttribute('aria-controls')).getAttribute('aria-labelledby'),to.id,'View panel is labelled by its tab')
}

// Focused examples exercise production-mounted primitives in both frameworks.
async function selectFramework(name) {
  framework.value=name
  framework.dispatchEvent(new window.Event('change',{bubbles:true}))
  await settle()
  assert.equal(document.querySelectorAll('.demo-panel').length,2,'Exactly two comparison panels')
  const inactive=name==='react'?'vue':'react'
  assert.equal(document.querySelector(`[data-demo="${inactive}"]`),null,'Inactive adapter is unmounted')
  assert.equal(document.querySelector(`[data-portal-owner="${inactive}"]`),null,'Inactive adapter portals are removed')
}
async function navigate(example) {
  const link=document.querySelector(`nav[aria-label="Examples"] a[href="#${example}"]`)
  assert.ok(link,`${example}: navigation link exists`)
  link.click()
  // Explicit dispatch also models hash-only navigation without a document reload.
  window.location.hash=example
  window.dispatchEvent(new window.HashChangeEvent('hashchange'))
  await settle()
  assert.equal(document.querySelector('.comparison-grid').dataset.example,example)
  assert.equal(link.getAttribute('aria-current'),'page',`${example}: active nav updates`)
}
const isChecked=control=>control instanceof window.HTMLInputElement ? control.checked : control.getAttribute('aria-checked')==='true'
for(const name of ['react','vue']) {
  await selectFramework(name)
  for(const example of ['switch','checkbox']) {
    await navigate(example)
    for(const owner of ['reference',name]) {
      const root=document.querySelector(`[data-demo="${owner}"]`)
      const controls=[...root.querySelectorAll(owner==='reference' ? `[role="${example}"]` : `input${example==='switch'?'[role="switch"]':'[type="checkbox"]'}`)]
      assert.equal(controls.length,3,`${owner} ${example}: three real controls`)
      assert.deepEqual(controls.map(isChecked),[true,false,true],`${owner} ${example}: initial states`)
      controls[1].click(); await settle()
      assert.equal(isChecked(controls[1]),true,`${owner} ${example}: unchecked control changes`)
      assert.match(root.querySelector('[role="status"]').textContent,/3 of 3/,`${owner} ${example}: status updates`)
      controls[0].click(); await settle()
      assert.equal(isChecked(controls[0]),false,`${owner} ${example}: checked control changes`)
      assert.ok(controls[2].disabled || controls[2].getAttribute('aria-disabled')==='true',`${owner} ${example}: final control disabled`)
      controls[2].click(); await settle()
      assert.equal(isChecked(controls[2]),true,`${owner} ${example}: disabled state preserved`)
      assert.match(root.querySelector('[role="status"]').textContent,/2 of 3/)
    }
  }
  await navigate('tabs')
  for(const owner of ['reference',name]) {
    const root=document.querySelector(`[data-demo="${owner}"]`)
    const tabs=[...root.querySelectorAll('[role="tab"]')]
    assert.deepEqual(tabs.map(tab=>tab.textContent),['Account','Password','Team'])
    assert.equal(root.querySelector('input[type="checkbox"], [role="switch"]'),null,'Tabs are a focused example')
    for(const [index,title] of [[1,'Password & security'],[2,'Your team'],[0,'Your account']]) {
      tabs[index].dispatchEvent(new window.MouseEvent('mousedown',{bubbles:true,button:0}))
      tabs[index].click(); await settle()
      assert.equal(tabs[index].getAttribute('aria-selected'),'true',`${owner}: selected tab updates`)
      const panels=[...root.querySelectorAll('[role="tabpanel"]')].filter(panel=>!panel.hidden && panel.getAttribute('data-state')!=='inactive')
      assert.ok(panels.some(panel=>panel.textContent.includes(title)),`${owner}: ${title} content is active`)
    }
  }
  await navigate('dialog')
  for(const owner of ['reference',name]) {
    const root=document.querySelector(`[data-demo="${owner}"]`)
    const trigger=[...root.querySelectorAll('button')].find(button=>button.textContent.trim()==='Review preferences')
    assert.ok(trigger,`${owner}: dialog trigger mounts`)
    for(const closeMethod of ['done','escape']) {
      trigger.click(); await settle()
      const dialog=document.querySelector(`[data-demo-dialog="${owner}"]`)
      assert.ok(dialog && !dialog.hidden,`${owner}: dialog opens`)
      assert.equal(dialog.getAttribute('role'),'dialog')
      assert.match(dialog.textContent,/Your preferences/)
      assert.match(dialog.textContent,/Marketing: off · Updates: on · Tips: on/)
      assert.ok(dialog.closest('[data-design="shadcn"]'),`${owner}: portal owns design theme`)
      if(closeMethod==='done') [...dialog.querySelectorAll('button')].find(button=>button.textContent.trim()==='Done').click()
      else dialog.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}))
      await settle()
      const closed=document.querySelector(`[data-demo-dialog="${owner}"]`)
      assert.ok(!closed || closed.hidden || closed.getAttribute('data-state')==='closed',`${owner}: ${closeMethod} closes dialog`)
    }
  }
  // Changing the framework while its dialog is open must remove its portal.
  document.querySelector(`[data-demo="${name}"] [data-scope="dialog"][data-part="trigger"]`).click()
  await settle()
  assert.ok(document.querySelector(`[data-demo-dialog="${name}"]`))
  await selectFramework(name==='react'?'vue':'react')
  assert.equal(document.querySelector(`[data-demo-dialog="${name}"]`),null,'Unmount removes open dialog')
}
// Simulate a browser back/forward hash update, independent from sidebar clicks.
window.history.replaceState(null,'','#checkbox')
window.dispatchEvent(new window.HashChangeEvent('hashchange'))
await settle()
assert.equal(document.querySelector('.comparison-grid').dataset.example,'checkbox','Hash navigation restores example')
assert.equal(document.querySelector('nav[aria-label="Examples"] [aria-current="page"]').getAttribute('href'),'#checkbox')
window.history.replaceState(null,'','/')
window.dispatchEvent(new window.HashChangeEvent('hashchange'))
await settle()
assert.equal(document.querySelector('.comparison-grid').dataset.example,'switch','Back to the hash-free homepage restores default example')
await navigate('tabs')
for(const hash of ['#main-content','#not-a-component']) {
  window.location.hash=hash
  window.dispatchEvent(new window.HashChangeEvent('hashchange'))
  await settle()
  assert.equal(document.querySelector('.comparison-grid').dataset.example,'tabs','Non-example anchors preserve the current example')
}
console.log('PASS: production bundle covers settings compatibility, focused controls/tabs/dialogs, React/Vue switching, portal cleanup, hash navigation, and CSS inspector in Happy DOM. Not a real-browser or visual test.')
await window.happyDOM.abort()
process.exit(0)
