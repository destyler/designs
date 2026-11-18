import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--worker') {
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win)) if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key]=win[key].bind(win)
 globalThis.window=win;globalThis.document=win.document
 const {run,runLocked}=await import(pathToFileURL(process.argv[3]));const settle=()=>new Promise(r=>setTimeout(r,80))
 const clean=[];for(const theme of ['default','midnight']) {const node=document.createElement('section');node.dataset.rdTheme=theme;document.body.append(node);clean.push(run(node))}await settle()
 const scopes=[...document.querySelectorAll('section')]
 const q=(scope,family,part)=>scope.querySelector(`[data-scope="${family}"][data-part="${part}"]`)
 const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length,'Unique IDs across theme scopes')
 for(const scope of scopes) {
  const input=scope.querySelector('input[type=checkbox]');assert.equal(input.type,'checkbox');assert.equal(input.name,'updates');assert.equal(scope.querySelector('select').name,'workspace')
  q(scope,'checkbox','control').click();await settle();assert.equal(input.checked,true)
  const other=scopes.find(s=>s!==scope);if(scope===scopes[0])assert.equal(other.querySelector('input[type=checkbox]').checked,false)
  q(scope,'select','trigger').click();await settle();assert.equal(q(scope,'select','content').closest('[data-rd-theme]'),scope);scope.dataset.rdTheme='midnight';scope.style.setProperty('--rd-accent','#f00');assert.equal(q(scope,'select','content').closest('[data-rd-theme]'),scope);let item=scope.querySelector('[data-scope="select"][data-part="item"][data-value="enterprise"]');assert.equal(item.getAttribute('aria-disabled'),'true');item.click();await settle();assert.equal(scope.querySelector('select').value,'')
  scope.querySelector('[data-scope="select"][data-part="item"][data-value="studio"]').click();await settle();assert.equal(scope.querySelector('select').value,'studio')
  for(let i=0;i<2;i++){q(scope,'dialog','trigger').click();await settle();const content=q(scope,'dialog','content');assert.equal(content.closest('[data-rd-theme]'),scope);scope.dataset.rdTheme=i?'default':'midnight';scope.style.setProperty('--rd-backdrop','#1238');assert.equal(content.closest('[data-rd-theme]'),scope);for(const attr of ['aria-labelledby','aria-describedby'])assert.ok(document.getElementById(content.getAttribute(attr)));q(scope,'dialog','close-trigger').click();await settle();assert.equal(q(scope,'dialog','trigger').getAttribute('aria-expanded'),'false')}
  q(scope,'dialog','trigger').click();await settle();document.activeElement.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await settle();assert.equal(q(scope,'dialog','trigger').getAttribute('aria-expanded'),'false')
 }
 const locked=document.createElement('section');locked.dataset.rdTheme='default';document.body.append(locked);const changes=[];clean.push(runLocked(locked,value=>changes.push(value)));await settle();
 q(locked,'checkbox','control').click();await settle();assert.equal(locked.querySelector('input[type=checkbox]').checked,false,'Controlled false remains authoritative');assert.equal(changes[0],true);
 q(locked,'select','trigger').click();await settle();locked.querySelector('[data-scope="select"][data-part="item"]').click();await settle();assert.equal(locked.querySelector('select').value,'','Controlled empty value remains authoritative');assert.equal(changes[1],'a');
 for(const fn of clean)await fn();await win.happyDOM.close();console.log('PASS ready scope and interactions')
} else for(const framework of ['react','solid']) test(`Ready ${framework}: controlled changes, disabled choices, dialog and two scopes`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-test-'))
 try{const {build}=await import('vite');const plugin=framework==='react'?(await import('@vitejs/plugin-react')).default():(await import('vite-plugin-solid')).default();
 const code=framework==='react'?`import {createElement} from 'react';import {createRoot} from 'react-dom/client';import {Demo} from '${root}examples/ready/react/Demo';export function run(target){const r=createRoot(target);r.render(createElement(Demo));return ()=>r.unmount()}`:`import {render} from 'solid-js/web';import {createComponent} from 'solid-js';import {Demo} from '${root}examples/ready/solid/Demo';export function run(target){return render(()=>createComponent(Demo,{}),target)}`
 const fixture=framework==='react'?`import {Checkbox,Select} from '${root}packages/ready/react';export function runLocked(target,change){const r=createRoot(target);r.render(createElement('div',null,createElement(Checkbox,{label:'Locked',checked:false,onCheckedChange:change}),createElement(Select,{label:'Locked choice',value:'',options:[{label:'A',value:'a'}],onValueChange:change})));return ()=>r.unmount()}`:`import {Checkbox,Select} from '${root}packages/ready/solid';export function runLocked(target,change){return render(()=>[createComponent(Checkbox,{label:'Locked',checked:false,onCheckedChange:change}),createComponent(Select,{label:'Locked choice',value:'',options:[{label:'A',value:'a'}],onValueChange:change})],target)}`;
 const entry=join(folder,'entry.mjs');await writeFile(entry,code+'\n'+fixture);await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}});const out=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000});assert.match(out,/PASS ready scope/)
 }finally{await rm(folder,{recursive:true,force:true})}
})
