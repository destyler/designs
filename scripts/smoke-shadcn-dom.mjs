import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Window } from 'happy-dom'
const window = new Window({ url:'http://localhost:4173', settings:{ disableCSSFileLoading:true, disableComputedStyleRendering:true } })
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
for(const name of ['reference','react','vue']) {
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
console.log('PASS: built production bundle mounts real Reference/React/Vue components and changes switch/tab state in Happy DOM. Not a real-browser or visual test.')
await window.happyDOM.abort()
process.exit(0)
