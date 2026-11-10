// Production compilation and happy-dom simulation, not a real-browser test.
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const out = path.join(here, '.verification')
const mode = process.argv[2]
if (!mode) {
  await mkdir(out, { recursive: true })
  const common = `import { examples } from ${JSON.stringify(path.join(here, 'registry.ts'))}; import { createSSRApp, h } from 'vue'; `
  for (const phase of ['ssr', 'client']) {
    const source = common + (phase === 'ssr' ? `import { renderToString } from '@vue/server-renderer'; export async function render(name) { const context = {}; const html = await renderToString(createSSRApp({render:()=>h(examples[name])}), context); return {html,teleports:context.teleports || {}}; } export const families = Object.keys(examples);` : `export function hydrate(name, target) { const app = createSSRApp({render:()=>h(examples[name])}); app.mount(target); return ()=>app.unmount(); }`)
    const entry = path.join(out, `${phase}-entry.mjs`)
    await writeFile(entry, source)
    await build({ configFile: false, root, plugins: [vue()], logLevel: 'warn', define: { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' }, build: { ssr: phase === 'ssr' ? entry : false, outDir: out, emptyOutDir: false, minify: false, lib: phase === 'client' ? {entry, formats:['es'],fileName:()=>`${phase}.mjs`} : undefined, rollupOptions: {output:{entryFileNames:`${phase}.mjs`,inlineDynamicImports:true}} } })
  }
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'ssr'], { cwd: root, stdio:'inherit', timeout:120000 })
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'client'], { cwd: root, stdio:'inherit', timeout:120000 })
} else if (mode === 'ssr') {
  if (typeof document !== 'undefined') throw new Error('SSR must run without a DOM')
  const {render,families} = await import(path.join(out,'ssr.mjs'))
  const results = {}
  for (const family of families) results[family] = await render(family)
  await writeFile(path.join(out,'ssr.json'),JSON.stringify(results,null,2))
  console.log(`Vue SSR without DOM: ${families.length}/46`)
} else {
  const {Window} = await import('happy-dom')
  const window = new Window({url:'http://localhost/'})
  for (const key of ['window','document','navigator','location','HTMLElement','Element','Node','Text','Comment','Document','DocumentFragment','SVGElement','HTMLInputElement','HTMLButtonElement','HTMLSelectElement','HTMLTextAreaElement','HTMLFieldSetElement','MutationObserver','ResizeObserver','IntersectionObserver','Event','CustomEvent','MouseEvent','PointerEvent','KeyboardEvent','FocusEvent','InputEvent','File','Blob','FileList','DOMRect','CSS','ShadowRoot']) {
    Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true,writable:true})
  }
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia']) globalThis[key] = window[key].bind(window)
  const {hydrate} = await import(path.join(out,'client.mjs'))
  const results = JSON.parse(await readFile(path.join(out,'ssr.json'),'utf8'))
  const report = { environment:'happy-dom simulated DOM; production client bundle; isolated no-DOM SSR process', limitations:['Not browser layout, focus-trap, pointer geometry, screen-reader, or visual verification.'], cases:[] }
  const settle = ()=>new Promise(resolve=>setTimeout(resolve,45))
  const assert = (value,message)=>{if(!value)throw new Error(message)}
  const q = (scope,part)=>document.querySelector(`[data-scope="${scope}"][data-part="${part}"]`)
  const click = async el=>{assert(el,'Missing interaction element');el.click();await settle()}
  for (const [family,{html,teleports}] of Object.entries(results)) {
    const warnings=[];const oldWarn=console.warn,oldError=console.error
    console.warn=(...args)=>warnings.push(args.map(String).join(' ')); console.error=(...args)=>warnings.push(args.map(String).join(' '))
    let dispose;const item={family,pass:false,retainedNodes:false,warnings,interactions:[]}
    try {
      // Vue caches its next teleport hydration anchor on the target. Each case is a fresh page.
      delete document.body._lpa
      document.body.innerHTML=(teleports.body||'')+`<div id="app">${html}</div>`
      if(['calendar','scroll-area'].includes(family)) {const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);assert(ids.length===new Set(ids).size,'SSR duplicate IDs: '+ids.filter((id,i)=>ids.indexOf(id)!==i).join(','));item.ssrIdsUnique=true}
      if(family==='splitter'){assert(document.querySelector('[role="separator"][tabindex="0"]')?.getAttribute('aria-label')==='Resize A and B panels','SSR splitter separator name');item.ssrNamedSeparator=true}
      const target=document.getElementById('app');const nodes=[...document.body.querySelectorAll('*')].filter(node=>node!==target)
      dispose=hydrate(family,target);await settle()
      item.retainedNodes=nodes.length>0&&nodes.every(node=>document.body.contains(node)); assert(item.retainedNodes,'Server element replaced during hydration')
      if(family==='splitter'){assert(document.querySelector('[role="separator"][tabindex="0"]')?.getAttribute('aria-label')==='Resize A and B panels','Hydrated splitter separator name');item.hydratedNamedSeparator=true}
      if(family==='calendar') {
        const tables=[...document.querySelectorAll('[data-scope="calendar"][data-part="table"]')];assert(tables.length===1,'Inline day calendar table');
        assert(!q('calendar','trigger')&&!q('calendar','input'),'Calendar must be inline rather than date-input popover');
        const cells=()=>[...document.querySelectorAll('[data-scope="calendar"][data-part="table-cell-trigger"]')].map(el=>el.getAttribute('data-value')).join(',');
        const initial=cells();await click(q('calendar','next-trigger'));assert(cells()!==initial,'Next month failed');await click(q('calendar','prev-trigger'));assert(cells()===initial,'Previous month failed');
        const year=q('calendar','year-select');year.value='2027';year.dispatchEvent(new window.Event('input',{bubbles:true}));await settle();assert(cells()!==initial,'Year selection failed');
        const month=q('calendar','month-select');month.value='10';month.dispatchEvent(new window.Event('input',{bubbles:true}));await settle();
        await click(document.querySelector('[data-scope="calendar"][data-part="table-cell-trigger"]:not([data-outside-range])'));assert(document.querySelector('[role="status"]').textContent.includes('Selected:'),'Day selection failed');item.interactions.push('inline calendar; next/previous month; year/month select; day and outside-day selection');
        await (await import('../../../scripts/lib/calendar-outside-selection.mjs')).verifyOutsideSelection(document, settle)
      }
      if(family==='scroll-area'){const thumbs=[...document.querySelectorAll('[data-scope="scroll-area"][data-part="thumb"]')];assert(thumbs.length===2&&new Set(thumbs.map(el=>el.dataset.orientation)).size===2,'Thumb orientation uniqueness');item.interactions.push('verify vertical/horizontal thumb semantics')}
      if(family==='checkbox') {for(const expected of ['checked','unchecked']){await click(q('checkbox','control'));assert(q('checkbox','control').dataset.state===expected,'Checkbox toggle failed')}item.interactions.push('toggle twice')}
      if(family==='dialog'){for(let i=0;i<2;i++){await click(q('dialog','trigger'));assert(q('dialog','content')?.dataset.state==='open','Dialog open failed');await click(q('dialog','close-trigger'));assert(!q('dialog','content')||q('dialog','content').dataset.state==='closed','Dialog close failed')}item.interactions.push('open/close twice')}
      if(family==='tabs'){for(const value of ['Vue','Solid','React']){const el=[...document.querySelectorAll('[data-scope="tabs"][data-part="trigger"]')].find(x=>x.textContent.includes(value));await click(el);assert(el.getAttribute('aria-selected')==='true','Tab selection failed')}item.interactions.push('Vue/Solid/React tabs')}
      if(family==='steps'){await click(q('steps','next-trigger'));await click(q('steps','next-trigger'));assert([...document.querySelectorAll('[data-scope="steps"][data-part="content"]')].some(el=>!el.hidden&&el.textContent.includes('Third')),'Step advance failed');await click(q('steps','prev-trigger'));assert([...document.querySelectorAll('[data-scope="steps"][data-part="content"]')].some(el=>!el.hidden&&el.textContent.includes('Second')),'Step back failed');item.interactions.push('next twice/back')}
      if(family==='select'){for(const value of ['vue','solid']){await click(q('select','trigger'));assert(q('select','trigger').getAttribute('aria-expanded')==='true','Select open failed');await click(document.querySelector(`[data-scope="select"][data-part="item"][data-value="${value}"]`));assert(q('select','value-text').textContent.toLowerCase().includes(value),'Select choice failed')}assert(document.querySelector('[role="status"]').textContent.includes('solid'),'Select status');item.interactions.push('choose Vue/Solid; selected status')}
      if(family==='pagination'){const status=()=>document.querySelector('[role="status"]').textContent;assert(status().includes('Page 1 of 10'),'Initial page');await click(q('pagination','next-trigger'));assert(status().includes('Page 2 of 10'),'Page change binding');await click(q('pagination','prev-trigger'));assert(status().includes('Page 1 of 10'),'Page back binding');item.interactions.push('next/back status binding')}
      if(family==='progress'){const status=()=>document.querySelector('[role="status"]').textContent;assert(status()==='65%','Initial progress');await click([...document.querySelectorAll('button')].find(el=>el.textContent==='Advance'));assert(status()==='75%','Advance progress');assert(q('progress','root').getAttribute('aria-valuenow')==='75'||document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')==='75','Progress ARIA');item.interactions.push('advance value/text/ARIA')}
      if(family==='clipboard'){const button=[...document.querySelectorAll('button')].find(el=>el.textContent==='Copy link');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{assert(value==='https://destyler.org','Copy value')}}});await click(button);assert(document.querySelector('[role="status"]').textContent==='Copied','Clipboard success');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}});await click(button);assert(document.querySelector('[role="status"]').textContent.includes('Copy unavailable'),'Clipboard rejection');item.interactions.push('copy resolve/reject feedback')}
      if(family==='dynamic'){const before=document.querySelectorAll('[data-scope="dynamic"][data-part="item"]').length;await click(q('dynamic','item-delete-trigger'));assert(document.querySelectorAll('[data-scope="dynamic"][data-part="item"]').length===before-1,'Tag removal failed');await click(q('dynamic','clear-trigger'));assert(document.querySelectorAll('[data-scope="dynamic"][data-part="item"]').length===0,'Tag clear failed');item.interactions.push('remove one tag then clear')}
      if(family==='tree'){const el=q('tree-view','branch-trigger');await click(el);assert(el.dataset.state==='open'&&!q('tree-view','branch-content').hidden,'Tree expand failed');await click(el);assert(el.dataset.state==='closed'&&q('tree-view','branch-content').hidden,'Tree collapse failed');item.interactions.push('expand/collapse branch')}
      if(family==='tour'){for(let i=0;i<2;i++){await click([...document.querySelectorAll('button')].find(el=>el.textContent.includes('Start tour')));assert(q('tour','content')&&!q('tour','content').hidden,'Tour start failed');await click(q('tour','close-trigger'));assert(!q('tour','content')||q('tour','content').hidden,'Tour dismiss failed')}item.interactions.push('start/dismiss twice')}
      assert(warnings.length===0,'Warnings/errors during hydration or interactions')
      item.pass=true
    }catch(error){item.error=String(error.stack||error)}finally{dispose?.();await settle();console.warn=oldWarn;console.error=oldError;await window.happyDOM.abort()}
    if(warnings.length)item.pass=false
    report.cases.push(item);console.log(`${family}: ${item.pass?'PASS':'FAIL'}${item.error?' '+item.error:''}${warnings.length?' '+warnings.join('\n'):''}`)
  }
  report.pass=report.cases.length===46&&report.cases.every(item=>item.pass)
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')
  await window.happyDOM.close();if(!report.pass)process.exitCode=1
}
