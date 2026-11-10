// No HTTP server or browser: real Svelte SSR + hydrate(recover:false) in Happy DOM.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
const here = fileURLToPath(new URL('.', import.meta.url))
const out = here + '.verification/'
const mode = process.argv[2]
const families = JSON.parse(await readFile(new URL('../shared/catalog.json', import.meta.url), 'utf8')).families
if (!mode) {
  process.env.NODE_ENV = 'development'
  const { build } = await import('vite')
  const { svelte } = await import('@sveltejs/vite-plugin-svelte')
  await mkdir(out, { recursive: true })
  for (const kind of ['ssr', 'client']) {
    const entry = out + kind + '-entry.mjs'
    await writeFile(entry, `import { examples } from '../registry.ts';\n` + (kind === 'ssr' ? `import { render } from 'svelte/server'; export const run = family => render(examples[family]).body;` : `import { hydrate, unmount, tick } from 'svelte'; export { tick }; export function run(family,target) { const app=hydrate(examples[family],{target,recover:false}); return () => unmount(app); }`))
    await build({ mode: 'development', configFile: false, root: here, logLevel: 'warn', plugins: [svelte({configFile:false,compilerOptions:{dev:true}})], ssr:{noExternal:true}, build: {ssr:kind==='ssr'?entry:false, outDir:out,emptyOutDir:false,minify:false, lib:kind==='client'?{entry,formats:['es'],fileName:()=>kind+'.mjs'}:undefined,rollupOptions:{output:{entryFileNames:kind+'.mjs',inlineDynamicImports:true}}} })
  }
  execFileSync(process.execPath,[fileURLToPath(import.meta.url),'ssr'],{stdio:'inherit'})
  execFileSync(process.execPath,[fileURLToPath(import.meta.url),'client'],{stdio:'inherit'})
} else {
  const rows=[]; let current; const log=console.log, warn=console.warn,error=console.error
  console.warn=(...v)=>current?.warnings.push(v.map(String).join(' '))
  console.error=(...v)=>current?.errors.push(v.map(String).join(' '))
  let win
  if(mode==='client') {
    const {Window}=await import('happy-dom')
    win=new Window({url:'http://localhost/',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true}})
    for(const key of Object.getOwnPropertyNames(win)) if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|KeyboardEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
      try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}
    }
    for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key]=win[key].bind(win)
    globalThis.window=win;globalThis.document=win.document
    win.addEventListener('error',e=>{current?.errors.push(String(e.error||e.message));e.preventDefault()})
    process.on('unhandledRejection',e=>current?.errors.push(String(e)))
  }
  const compiled=await import(pathToFileURL(out+mode+'.mjs'))
  const pause=()=>new Promise(r=>setTimeout(r,40))
  for(const family of families) {
    current={family,mode,warnings:[],errors:[]}; rows.push(current);let cleanup
    try {
      if(mode==='ssr'){
        assert.equal(typeof window,'undefined'); const html=compiled.run(family);assert.ok(html.length);
        const ids=[...html.matchAll(/\sid="([^"]*)"/g)].map(match=>match[1]);assert.ok(ids.every(id=>! /\s/.test(id)),'Whitespace in SSR element IDs');current.whitespaceFreeIds=true;current.bytes=Buffer.byteLength(html);await writeFile(out+family+'.html',html)
      }else{
        document.body.innerHTML='<div id="target"></div>';const target=document.querySelector('#target');target.innerHTML=await readFile(out+family+'.html','utf8')
        const original=[...target.querySelectorAll('[data-scope][data-part]')];const anchor=target.firstChild
        cleanup=compiled.run(family,target);await compiled.tick();await pause()
        assert.equal(target.firstChild,anchor,'SSR root anchor replaced')
        const retained=original.filter(n=>n.isConnected);current.serverNodes=original.length;current.retainedServerNodes=retained.length
        assert.equal(retained.length, original.length, 'SSR primitive nodes replaced or removed')
        // Portal relocation retains identity; conditional presence can remove closed content.
        const meaningful=original.filter(n=>['root','trigger','control','input','label','item','list','track','tree'].includes(n.dataset.part))
        assert.ok(meaningful.length===0||meaningful.some(n=>n.isConnected),'No meaningful SSR node retained')
        current.rootAnchorRetained=true
        assert.ok([...document.querySelectorAll('[id]')].every(node=>! /\s/.test(node.id)), 'Whitespace in hydrated element IDs')
        current.whitespaceFreeIds=true
        const part=(scope,name)=>document.querySelector(`[data-scope="${scope}"][data-part="${name}"]`)
        if(family==='splitter'){
          const resize=part('splitter','resize-trigger')
          assert.ok(resize)
          assert.equal(resize.getAttribute('role'),'separator')
          assert.equal(resize.getAttribute('aria-label'),'Resize A and B panels')
          assert.equal(resize.tabIndex,0)
          current.splitterRegression={role:resize.getAttribute('role'),accessibleLabel:resize.getAttribute('aria-label'),focusable:true}
        }
        if(family==='scroll-area'){
          const thumbs=[...document.querySelectorAll('[data-scope="scroll-area"][data-part="thumb"]')]
          assert.equal(thumbs.length,2)
          assert.deepEqual(thumbs.map(node=>node.dataset.orientation).sort(),['horizontal','vertical'])
          assert.ok(thumbs.every(node=>node.id),'Scroll thumbs must have IDs')
          assert.equal(new Set(thumbs.map(node=>node.id)).size,2,'Duplicate scroll thumb IDs')
          for(const thumb of thumbs){
            const scrollbar=thumb.closest('[data-scope="scroll-area"][data-part="scrollbar"]')
            assert.ok(scrollbar)
            assert.equal(thumb.dataset.orientation,scrollbar.dataset.orientation)
            assert.equal(scrollbar.getAttribute('aria-orientation'),thumb.dataset.orientation)
          }
          current.scrollThumbRegression={ids:thumbs.map(node=>node.id),orientations:thumbs.map(node=>node.dataset.orientation),uniqueIds:true,parentOrientationMatched:true}
        }
        if(family==='calendar'){
          const tables=[...document.querySelectorAll('[data-scope="calendar"][data-part="table"]')];assert.equal(tables.length,1);assert.equal(tables[0].dataset.view,'day');
          assert.equal(part('calendar','trigger'),null);assert.equal(part('calendar','input'),null);
          const cells=()=>[...document.querySelectorAll('[data-scope="calendar"][data-part="table-cell-trigger"]')].map(el=>el.getAttribute('data-value')).join(',');
          const initial=cells();part('calendar','next-trigger').click();await pause();assert.notEqual(cells(),initial);part('calendar','prev-trigger').click();await pause();assert.equal(cells(),initial);
          const year=part('calendar','year-select');year.value='2027';year.dispatchEvent(new win.Event('input',{bubbles:true}));await pause();assert.notEqual(cells(),initial);
          document.querySelector('[data-scope="calendar"][data-part="table-cell-trigger"]:not([data-outside-range])').click();await pause();assert.match(document.querySelector('[role="status"]').textContent,/Selected:/);
          await (await import('../../../scripts/lib/calendar-outside-selection.mjs')).verifyOutsideSelection(document, pause)
          current.calendarTableRegression={inline:true,uniqueIds:true,nextPreviousAndYear:true,dateSelection:true,outsideDateSelection:true};
        }
        if(['checkbox','switch'].includes(family)){
          const input=document.querySelector('input');const initial=input.checked
          for(let i=0;i<4;i++){input.click();await pause();assert.equal(input.checked,i%2===0?!initial:initial);assert.equal(part(family,'root').dataset.state,input.checked?'checked':'unchecked')}
          current.interactions={toggleClicks:4}
        }
        if(family==='dialog'){
          for(let i=0;i<3;i++){part('dialog','trigger').click();await pause();assert.equal(part('dialog','trigger').getAttribute('aria-expanded'),'true');part('dialog','close-trigger').click();await pause();assert.equal(part('dialog','trigger').getAttribute('aria-expanded'),'false')}
          current.interactions={openCloseCycles:3}
        }
        if(family==='tabs'){
          const triggers=[...document.querySelectorAll('[data-scope="tabs"][data-part="trigger"]')].filter(n=>!n.disabled)
          for(let i=0;i<4;i++){const t=triggers[i%triggers.length];t.click();await pause();assert.equal(t.getAttribute('aria-selected'),'true')}
          current.interactions={tabClicks:4}
        }
        if(family==='select'){
          for(const value of ['react','solid','vue','react']){part('select','trigger').click();await pause();const item=document.querySelector(`[data-scope="select"][data-part="item"][data-value="${value}"]`);assert.ok(item);item.click();await pause();assert.equal(document.querySelector('select').value,value)}
          current.interactions={selections:4}
        }
        if(family==='pagination'){
          assert.match(document.querySelector('[role="status"]').textContent,/Page 1 of 10/);part('pagination','next-trigger').click();await pause();assert.match(document.querySelector('[role="status"]').textContent,/Page 2 of 10/);part('pagination','prev-trigger').click();await pause();assert.match(document.querySelector('[role="status"]').textContent,/Page 1 of 10/);current.interactions={nextBack:true};
        }
        if(family==='progress'){
          assert.equal(document.querySelector('[role="status"]').textContent,'65%');[...document.querySelectorAll('button')].find(el=>el.textContent==='Advance').click();await pause();assert.equal(document.querySelector('[role="status"]').textContent,'75%');assert.equal(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),'75');current.interactions={advance:true};
        }
        if(family==='clipboard'){
          const button=[...document.querySelectorAll('button')].find(el=>el.textContent==='Copy link');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>assert.equal(value,'https://destyler.org')}});button.click();await pause();assert.equal(document.querySelector('[role="status"]').textContent,'Copied');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}});button.click();await pause();assert.match(document.querySelector('[role="status"]').textContent,/Copy unavailable/);current.interactions={resolveReject:true};
        }
        if(family==='steps'){
          for(let i=0;i<2;i++){part('steps','next-trigger').click();await pause();assert.equal([...document.querySelectorAll('[data-scope="steps"][data-part="item"]')][i+1].getAttribute('aria-current'),'step')}
          part('steps','prev-trigger').click();await pause();assert.equal([...document.querySelectorAll('[data-scope="steps"][data-part="item"]')][1].getAttribute('aria-current'),'step');current.interactions={nextClicks:2,previousClicks:1}
        }
        await cleanup();cleanup=undefined;await pause()
      }
      assert.deepEqual(current.warnings,[]);assert.deepEqual(current.errors,[]);current.pass=true
    } catch(e){current.pass=false;current.exception=String(e.stack||e)}finally{if(cleanup){try{await cleanup()}catch(e){current.errors.push(String(e))}}}
    log(`${mode} ${family}: ${current.pass?'PASS':'FAIL '+current.exception?.split('\n')[0]}`)
  }
  console.warn=warn;console.error=error
  if(win) await win.happyDOM.close()
  const report={framework:'svelte',mode,pass:rows.every(r=>r.pass),cases:rows,limitations:['Happy DOM is not a browser: no layout, focus-trap, animation, accessibility, canvas drawing, image decode or real file-download claims. Actual SSR nodes are passed to Svelte hydrate with recover:false.']}
  await writeFile(out+mode+'-report.json',JSON.stringify(report,null,2)+'\n')
  if(!report.pass)process.exitCode=1
}
