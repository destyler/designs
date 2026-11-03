import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Window } from 'happy-dom'
const window = new Window({ url:'http://localhost:4173/#settings', settings:{ disableCSSFileLoading:true, disableComputedStyleRendering:true } })
for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','Element','Node','NodeFilter','Event','CustomEvent','MouseEvent','KeyboardEvent','MutationObserver','ResizeObserver','IntersectionObserver','SVGElement','DocumentFragment','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) {
  const value = key==='window' ? window : typeof window[key] === 'function' && ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(key) ? window[key].bind(window) : window[key]
  Object.defineProperty(globalThis,key,{configurable:true,value})
}
for (const key of Object.getOwnPropertyNames(window)) {
  if (/^(HTML.*Element|SVG.*Element|Document|ShadowRoot|CSS.*|Node.*)$/.test(key) && !(key in globalThis)) Object.defineProperty(globalThis,key,{configurable:true,value:window[key]})
}
window.document.body.innerHTML='<div id="app"></div>'
const html=await readFile('dist/index.html','utf8')
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
const inspectorToggle=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='View CSS')
assert.ok(inspectorToggle,'CSS inspector toggle mounts')
assert.equal(inspectorToggle.getAttribute('aria-expanded'),'false')
inspectorToggle.click(); await settle()
assert.ok(document.querySelector('#css-inspector [data-testid="css-source"]'),'CSS inspector source renders on demand')
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
    const trigger=[...root.querySelectorAll('button')].find(button=>button.textContent==='Review preferences')
    assert.ok(trigger,`${owner}: dialog trigger mounts`)
    for(const closeMethod of ['done','escape']) {
      trigger.click(); await settle()
      const dialog=document.querySelector(`[data-demo-dialog="${owner}"]`)
      assert.ok(dialog && !dialog.hidden,`${owner}: dialog opens`)
      assert.equal(dialog.getAttribute('role'),'dialog')
      assert.match(dialog.textContent,/Your preferences/)
      assert.match(dialog.textContent,/Marketing: off · Updates: on · Tips: on/)
      assert.ok(dialog.closest('[data-design="shadcn"]'),`${owner}: portal owns design theme`)
      if(closeMethod==='done') [...dialog.querySelectorAll('button')].find(button=>button.textContent==='Done').click()
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
console.log('PASS: production bundle covers settings compatibility, focused controls/tabs/dialogs, React/Vue switching, portal cleanup, hash navigation, and CSS inspector in Happy DOM. Not a real-browser or visual test.')
await window.happyDOM.abort()
process.exit(0)
