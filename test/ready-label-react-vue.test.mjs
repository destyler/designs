// DOM label source links/text, not a computed accessibility tree.
import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
if(process.argv[2]==='--worker'){
  const {Window}=await import('happy-dom');const win=new Window({url:'http://localhost/'})
  for(const key of Object.getOwnPropertyNames(win))if(['window','document','navigator'].includes(key)||/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)){try{Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:win[key]})}catch{}}
  for(const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=win[key].bind(win)
  const target=document.createElement('div');document.body.append(target)
  const {run,invalid}=await import(pathToFileURL(process.argv[3]));const app=run(target);const settle=()=>new Promise(r=>setTimeout(r,120));await settle()
  const report=[];let previousIds;
  for(const label of ['Initial label','  Updated label  ']){
    app.error(label);await settle()
    const ids=[...target.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);if(previousIds)assert.deepEqual(ids,previousIds);previousIds=ids
    const rows=[];
    for(const node of target.querySelectorAll('input,select,[data-scope=select][data-part=trigger]')){
      const linked=(node.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id));
      const implicit=[...target.querySelectorAll('label')].filter(n=>n.htmlFor===node.id);
      const labelSourceText=(linked.length?linked:implicit).map(n=>n?.textContent||'').join(' ').trim();
      const described=(node.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id));assert.ok(described.every(Boolean),'No dangling descriptions');
      assert.equal(labelSourceText,label.trim());assert.ok((linked.length?linked:implicit).some(n=>n?.textContent===label),'Supplied text not trimmed');rows.push({tag:node.tagName,labelSourceText,labelledby:node.getAttribute('aria-labelledby'),descriptions:described.map(n=>n.textContent)});
    }
    const dialog=target.querySelector('[role=dialog]'),trigger=target.querySelector('[data-scope=dialog][data-part=trigger]'); const title=document.getElementById(dialog.getAttribute('aria-labelledby'));assert.ok(title);assert.equal(title.textContent,label);assert.equal(trigger.textContent,label);assert.equal(target.querySelector('[data-scope=dialog][data-part=description]'),null);assert.equal(target.querySelector('[data-scope=select][data-part=value-text]').textContent,'');report.push({label,rows,dialog:{trigger:trigger.textContent,title:title.textContent}});
  }
  assert.deepEqual(report[0].rows.slice(3).map(row=>row.descriptions),[['Checkbox help','Initial label'],['Select help','Initial label'],['Select help','Initial label']]);await app.cleanup();
  for(const [component,prop] of [['Checkbox','label'],['Select','label'],['Dialog','trigger'],['Dialog','title']])for(const value of ['', ' \t '])for(const dynamic of [false,true]){
    const host=document.createElement('div');document.body.append(host);const errors=[];let fixture;
    try{fixture=invalid(host,component,prop,dynamic?'Valid':value,e=>errors.push(e))}catch(e){errors.push(e)}await settle();
    if(dynamic){try{fixture.update(value)}catch(e){errors.push(e)}await settle()}
    assert.ok(errors.some(e=>e.message===`Ready ${component}: ${prop} must contain non-whitespace text.`),`${component}.${prop} initial/dynamic=${dynamic} must fail`);
    if(fixture)await fixture.cleanup();host.remove();await settle();
  }
  await win.happyDOM.close();console.log('PASS Ready native label observation')
}else for(const framework of ['react','vue'])test(`Ready ${framework}: required visible text rejects initial/dynamic blanks and preserves label associations`,{timeout:120000},async()=>{
  const folder=await mkdtemp(join(root,'node_modules/.ready-native-'))
  try{
    let plugin,code;const source=`${root}packages/ready/${framework}`
    if(framework==='react'){
      plugin=(await import('@vitejs/plugin-react')).default()
      code=`import {createElement as h,useState} from 'react';import {createRoot} from 'react-dom/client';import {Field} from '@destyler-ui/react';import {Checkbox,Select,Dialog} from '${source}';export function run(target){let disable,error,require,field,parentDisable;function App(){const [disabled,set]=useState(false),[message,setError]=useState('Initial label'),[required,setRequired]=useState(true),[ancestor,setAncestor]=useState(false),[parentDisabled,setParentDisabled]=useState(undefined);disable=set;error=setError;require=setRequired;field=setAncestor;parentDisable=setParentDisabled;return h('form',null,h(Checkbox,{label:message}),h(Select,{label:message,placeholder:'',options:[]}),h(Dialog,{title:message,trigger:message,description:'',open:true}),h(Field.Root,{required:ancestor,invalid:ancestor,...(parentDisabled===undefined?{}:{disabled:parentDisabled})},h(Field.HelperText,null,'Checkbox help'),h(Checkbox,{label:message,name:'updates',required,...(disabled===undefined?{}:{disabled}),error:message})),h(Field.Root,{required:ancestor,invalid:ancestor,...(parentDisabled===undefined?{}:{disabled:parentDisabled})},h(Field.HelperText,null,'Select help'),h(Select,{label:message,name:'plan',required,...(disabled===undefined?{}:{disabled}),error:message,options:[{label:'A',value:'a'}]})))}const root=createRoot(target);root.render(h(App));return{disable:v=>disable(v),error:v=>error(v),require:v=>require(v),field:v=>field(v),parentDisable:v=>parentDisable(v),cleanup:()=>root.unmount()}}`
    }else{
      plugin=(await import('@vitejs/plugin-vue')).default()
      code=`import {createApp,h,ref} from 'vue';import {Field} from '@destyler-ui/vue';import {Checkbox,Select,Dialog} from '${source}';export function run(target){const disabled=ref(false),error=ref('Initial label'),required=ref(true),ancestor=ref(false),parentDisabled=ref(undefined);const app=createApp({render:()=>h('form',[h(Checkbox,{label:error.value}),h(Select,{label:error.value,placeholder:'',options:[]}),h(Dialog,{title:error.value,trigger:error.value,description:'',open:true}),h(Field.Root,{required:ancestor.value,invalid:ancestor.value,...(parentDisabled.value===undefined?{}:{disabled:parentDisabled.value})},{default:()=>[h(Field.HelperText,null,{default:()=> 'Checkbox help'}),h(Checkbox,{label:error.value,name:'updates',required:required.value,...(disabled.value===undefined?{}:{disabled:disabled.value}),error:error.value})]}),h(Field.Root,{required:ancestor.value,invalid:ancestor.value,...(parentDisabled.value===undefined?{}:{disabled:parentDisabled.value})},{default:()=>[h(Field.HelperText,null,{default:()=> 'Select help'}),h(Select,{label:error.value,name:'plan',required:required.value,...(disabled.value===undefined?{}:{disabled:disabled.value}),error:error.value,options:[{label:'A',value:'a'}]})]})])});app.mount(target);return{disable:v=>disabled.value=v,error:v=>error.value=v,require:v=>required.value=v,field:v=>ancestor.value=v,parentDisable:v=>parentDisabled.value=v,cleanup:()=>app.unmount()}}`
    }
    code+=framework==='react'?`
export function invalid(target,component,prop,value,error){let update;function App(){const [text,set]=useState(value);update=set;return h({Checkbox,Select,Dialog}[component],{label:'Valid',trigger:'Valid',title:'Valid',options:[],[prop]:text})}const root=createRoot(target,{onUncaughtError:error});root.render(h(App));return{update:v=>update(v),cleanup:()=>root.unmount()}}`:`
export function invalid(target,component,prop,value,error){const text=ref(value);const app=createApp({render:()=>h({Checkbox,Select,Dialog}[component],{label:'Valid',trigger:'Valid',title:'Valid',options:[],[prop]:text.value})});app.config.errorHandler=error;app.mount(target);return{update:v=>text.value=v,cleanup:()=>app.unmount()}}`
    const {build}=await import('vite');const entry=join(folder,'entry.mjs');await writeFile(entry,code)
    await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'client.mjs'}}})
    const output=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--worker',join(folder,'out/client.mjs')],{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,/PASS Ready native/)


  }finally{await rm(folder,{recursive:true,force:true})}
})
