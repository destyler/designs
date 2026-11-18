// Opt-in architecture experiment. Uses UI primitives, not a change to Ready components.
// HappyDOM verifies topology/events only, not clipping, layout, scroll or computed style.
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--server'){
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 const {render}=await import(pathToFileURL(process.argv[3]));await writeFile(process.argv[4],render(JSON.parse(process.argv[5])))
}else if(process.argv[2]==='--client'){
 const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
 for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
 for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
 const config=JSON.parse(process.argv[5]),background=document.createElement('button');background.textContent='Background';document.body.append(background);background.focus()
 const baseline={pointer:document.body.style.pointerEvents,overflow:document.body.style.overflow,aria:background.getAttribute('aria-hidden')}
 const target=document.createElement('div');target.innerHTML=await readFile(process.argv[4],'utf8');document.body.append(target)
 const part=(scope,name)=>target.querySelector(`[data-scope=${scope}][data-part=${name}]`)
 const originalDialog=part('dialog','content'),originalSelect=part('select','trigger'),originalPopup=part('select','content');
 const originalIds=[...target.querySelectorAll('[id]')].map(n=>n.id).sort()
 assert.equal(new Set(originalIds).size,originalIds.length)
 assert.ok(originalPopup.closest('[data-nested-scope]'),'SSR popup begins inside nested override')
 assert.equal(originalPopup.closest('[data-rd-theme]').getAttribute('data-rd-theme'),config.theme==='default'?'midnight':'default')
 assert.ok(target.querySelector('[data-overlay-host]'));assert.equal(target.querySelector('[data-overlay-host]').children.length,0)
 const warnings=[];const oldWarn=console.warn,oldError=console.error;console.warn=(...a)=>warnings.push(a.join(' '));console.error=(...a)=>warnings.push(a.join(' '))
 const {hydrate}=await import(pathToFileURL(process.argv[3]));const app=hydrate(target,config,warnings)
 const settle=()=>new Promise(r=>setTimeout(r,140));await settle()
 const moved=config.relocation!=='inline'&&!(config.relocation==='defer'&&config.initialSelectOpen);
 const popup=part('select','content'),host=target.querySelector('[data-overlay-host]'),scroll=target.querySelector('[data-scroll-region]')
 assert.equal(originalDialog,part('dialog','content'),'Modal container is hydrated in place')
 assert.equal(originalSelect,part('select','trigger'),'Select trigger is hydrated in place')
 assert.equal(originalPopup===popup,!moved,'Only actual relocation remounts popup DOM')
 assert.equal(originalPopup.isConnected,!moved);assert.equal(host.contains(popup),moved);assert.ok(originalDialog.contains(host));assert.ok(!scroll.contains(host));assert.equal(scroll.contains(popup),!moved)
 assert.deepEqual([...target.querySelectorAll('[id]')].map(n=>n.id).sort(),originalIds,'Remount retains primitive context IDs')
 assert.equal(Boolean(popup.closest('[data-nested-scope]')),!moved,'Relocation loses nested override ancestry')
 assert.equal(popup.closest('[data-rd-theme]').getAttribute('data-rd-theme'),moved?config.theme:(config.theme==='default'?'midnight':'default'))
 assert.equal(scroll.style.overflow,'auto');assert.equal(originalDialog.style.overflow,'visible')
 const mounts=globalThis.__overlayLifecycle;assert.equal(mounts.mounts,moved?2:1);assert.equal(mounts.unmounts,moved?1:0,'Hydrated inline popup is disposed after switching destination')
 const dialogTrigger=part('dialog','trigger');if(!config.initialOpen){dialogTrigger.focus();dialogTrigger.click();await settle()}
 assert.equal(dialogTrigger.getAttribute('aria-expanded'),'true');assert.ok(originalDialog.contains(document.activeElement),'Opening requests focus inside dialog')
 assert.equal(background.getAttribute('aria-hidden'),'true');assert.equal(document.body.style.pointerEvents,'none');assert.equal(document.body.style.overflow,'hidden')
 const focusBeforeSelectInteraction={id:document.activeElement?.id,part:document.activeElement?.getAttribute('data-part'),insidePopup:popup.contains(document.activeElement)};
 const selectTrigger=part('select','trigger');if(!config.initialSelectOpen){selectTrigger.focus();selectTrigger.click();await settle();}assert.equal(selectTrigger.getAttribute('aria-expanded'),'true');assert.equal(host.contains(part('select','content')),moved)
 const popupAncestry=[];for(let node=popup;node;node=node.parentElement){popupAncestry.push({part:node.getAttribute('data-part'),ariaHidden:node.getAttribute('aria-hidden'),inert:node.hasAttribute('inert')});assert.notEqual(node.getAttribute('aria-hidden'),'true');assert.equal(node.hasAttribute('inert'),false);if(node===originalDialog)break}
 if(config.escapeTarget==='content'){part('select','content').focus();assert.equal(document.activeElement,part('select','content'))}
 const layerSnapshot=()=>[originalDialog,part('select','content'),originalPopup].map((node,index)=>({which:['dialog','currentPopup','originalPopup'][index],id:node.id,layerIndex:node.style.getPropertyValue('--layer-index'),isConnected:node.isConnected}));
 const beforeEscapeLayers=layerSnapshot();
 const eventTrace=[];document.addEventListener('keydown',event=>eventTrace.push({phase:'capture',key:event.key,targetId:event.target.id,targetPart:event.target.getAttribute?.('data-part'),activeId:document.activeElement?.id,selectOpen:selectTrigger.getAttribute('aria-expanded'),dialogOpen:dialogTrigger.getAttribute('aria-expanded')}),true);
 const key=async key=>{document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await settle()}
 await key('Escape');const firstEscape={selectOpen:selectTrigger.getAttribute('aria-expanded')==='true',dialogOpen:dialogTrigger.getAttribute('aria-expanded')==='true'};assert.equal(firstEscape.selectOpen,false);if(!config.initialSelectOpen)assert.equal(firstEscape.dialogOpen,true,'First Escape closes only child');
 if(firstEscape.dialogOpen)await key('Escape');assert.equal(dialogTrigger.getAttribute('aria-expanded'),'false','Modal eventually closes')
 assert.equal(document.activeElement,config.initialOpen?background:dialogTrigger,'Return focus uses pre-open active element')
 assert.equal(background.getAttribute('aria-hidden'),baseline.aria);assert.equal(document.body.style.pointerEvents,baseline.pointer);assert.equal(document.body.style.overflow,baseline.overflow)
 dialogTrigger.focus();dialogTrigger.click();await settle();selectTrigger.focus();selectTrigger.click();await settle();assert.equal(selectTrigger.getAttribute('aria-expanded'),'true')
 await app.cleanup();await settle();assert.equal(background.getAttribute('aria-hidden'),baseline.aria);assert.equal(document.body.style.pointerEvents,baseline.pointer);assert.equal(document.body.style.overflow,baseline.overflow);assert.equal(mounts.unmounts,mounts.mounts)
 assert.deepEqual(warnings,[]);console.warn=oldWarn;console.error=oldError
 const report={...config,hydrationWarnings:warnings,dialogAndTriggerReused:true,popupRemounted:moved,primitiveIdsStable:true,popupMounts:mounts.mounts,popupUnmounts:mounts.unmounts,focusBeforeSelectInteraction,outerThemeAncestryPreserved:true,nestedOverrideAncestryLost:moved,popupAncestry,eventTrace,beforeEscapeLayers,primitiveEvents:globalThis.__overlayEvents??[],firstEscape,escapeLayersAndCleanup:!config.initialSelectOpen,knownInitialSelectOpenLimit:config.initialSelectOpen&&!firstEscape.dialogOpen,limitations:['No actual layout, clipping or scroll proof','No computed theme values or screen-reader proof','Moving a mounted portal destination recreates popup DOM; local DOM state is not preserved','Initially open Select is observational only: first Escape may dismiss both layers','Option selection and dynamic options are not exercised','Popper coordinates and autoUpdate correctness are not verified']};await writeFile(process.argv[6],JSON.stringify(report,null,2));await win.happyDOM.close();console.log(config.initialSelectOpen?'OBSERVED initial-open Select limitation':'PASS React overlay host experiment')
}else{
 const evidence=await mkdtemp('/tmp/ready-overlay-host-react-');console.log(`Evidence: ${evidence}`)
 const folder=await mkdtemp(join(root,'node_modules/.ready-overlay-host-'))
 try{
 const app=`import {useState,useEffect,useRef} from 'react';import {createPortal} from 'react-dom';import {Dialog as D,Select as S,createListCollection} from '@destyler-ui/react';
 function record(scope,event,detail){(globalThis.__overlayEvents??=[]).push({scope,event,...detail})}
 function Popup(){useEffect(()=>{const count=globalThis.__overlayLifecycle??={mounts:0,unmounts:0};count.mounts++;return()=>{count.unmounts++}},[]);return <S.Positioner><S.Content><S.Item item={{value:'a',label:'A'}}><S.ItemText>A</S.ItemText><S.ItemIndicator>✓</S.ItemIndicator></S.Item><S.Item item={{value:'b',label:'B'}}><S.ItemText>B</S.ItemText><S.ItemIndicator>✓</S.ItemIndicator></S.Item></S.Content></S.Positioner>}
 export default function App({initialOpen,initialSelectOpen=false,theme,relocation='after'}){const [open,setOpen]=useState(initialOpen),[selectOpen,setSelectOpen]=useState(initialSelectOpen),[host,setHost]=useState(null);const hostRef=useRef(null);useEffect(()=>{if(!host&&relocation!=='inline'&&(relocation!=='defer'||!selectOpen))setHost(hostRef.current)},[host,relocation,selectOpen]);const collection=createListCollection({items:[{value:'a',label:'A'},{value:'b',label:'B'}]});const popup=<Popup/>;return <section data-rd-theme={theme}><D.Root open={open} onOpenChange={d=>{record('dialog','openChange',{open:d.open});setOpen(d.open)}} onEscapeKeyDown={e=>record('dialog','escapeKeyDown',{defaultPrevented:e.defaultPrevented,targetId:e.target?.id})}><D.Trigger>Open dialog</D.Trigger><D.Backdrop/><D.Positioner><D.Content style={{overflow:'visible'}}><D.Title>Preferences</D.Title><D.Description>Overlay host experiment</D.Description><div data-scroll-region style={{overflow:'auto',maxHeight:'240px'}}><div data-nested-scope data-rd-theme={theme==='default'?'midnight':'default'} style={{'--rd-accent':'#8b22aa'}}><S.Root collection={collection} open={selectOpen} onOpenChange={d=>{record('select','openChange',{open:d.open});setSelectOpen(d.open)}} onFocusOutside={e=>record('select','focusOutside',{defaultPrevented:e.defaultPrevented,targetId:e.detail?.originalEvent?.target?.id??e.target?.id})}><S.Label>Plan</S.Label><S.Control><S.Trigger><S.ValueText placeholder="Choose"/><S.Indicator>⌄</S.Indicator></S.Trigger></S.Control>{host?createPortal(popup,host):popup}<S.HiddenSelect/></S.Root></div></div><div data-overlay-host ref={hostRef}/><D.CloseTrigger>Close</D.CloseTrigger></D.Content></D.Positioner></D.Root></section>}`
 await writeFile(join(folder,'App.tsx'),app)
 await writeFile(join(folder,'server.mjs'),`import {createElement} from 'react';import {renderToString} from 'react-dom/server';import App from './App';export const render=config=>renderToString(createElement(App,config),{identifierPrefix:'overlay-'})`)
 await writeFile(join(folder,'client.mjs'),`import {createElement} from 'react';import {hydrateRoot} from 'react-dom/client';import App from './App';export function hydrate(target,config,warnings){const root=hydrateRoot(target,createElement(App,config),{identifierPrefix:'overlay-',onRecoverableError:e=>warnings.push(String(e))});return{cleanup:()=>root.unmount()}}`)
 const {build}=await import('vite');const plugin=(await import('@vitejs/plugin-react')).default()
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:join(folder,'server.mjs'),outDir:join(folder,'server'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
 await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'client'),minify:false,lib:{entry:join(folder,'client.mjs'),formats:['es'],fileName:()=> 'client.mjs'}}})
 const cases=process.argv.includes('--compare')?[...['inline','defer','after'].map(relocation=>({theme:'default',initialOpen:true,initialSelectOpen:true,relocation})),...['inline','after'].map(relocation=>({theme:'default',initialOpen:true,initialSelectOpen:true,relocation,escapeTarget:'content'}))]:[...['default','midnight'].flatMap(theme=>[false,true].map(initialOpen=>({theme,initialOpen}))),{theme:'default',initialOpen:true,initialSelectOpen:true}];
 for(const scenario of cases){const {theme,initialOpen,initialSelectOpen}=scenario;const config=JSON.stringify(scenario),name=`${theme}-${initialOpen?'open':'closed'}${initialSelectOpen?'-select-open':''}${scenario.relocation?'-'+scenario.relocation:''}${scenario.escapeTarget?'-'+scenario.escapeTarget:''}`,html=join(evidence,`${name}.html`);execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'server/server.mjs'),html,config],{cwd:root,encoding:'utf8',timeout:30000});const output=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--client',join(folder,'client/client.mjs'),html,config,join(evidence,`${name}.json`)],{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,initialSelectOpen?/OBSERVED initial-open Select/:/PASS React overlay/);console.log(name,initialSelectOpen?'OBSERVED (not acceptance)':'PASS')}
 }finally{await rm(folder,{recursive:true,force:true})}
}
