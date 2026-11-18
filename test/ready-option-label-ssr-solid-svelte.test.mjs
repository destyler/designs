// Real server compilation/rendering in a fresh process without DOM globals.
// This verifies HTML/text and runtime rejection, not a browser accessibility tree.
import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {join} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url))
const message='Ready Select: option.label must contain non-whitespace text.'
if(process.argv[2]==='--server'){
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 const {html}=await import(pathToFileURL(process.argv[3]))
 const nativeLabels=source=>[...source.matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/g)].map(match=>match[1].replace(/<[^>]*>/g,''))
 const failures=[]
 for(const label of ['', ' \t\n '])for(const disabled of [false,true]){
  let error,source
  try{source=html([{label,value:'a',disabled}])}catch(e){error=e}
  if(error?.message!==message)failures.push({label,disabled,error:error?.message,renderedNativeLabels:source?nativeLabels(source):undefined})
 }
 assert.deepEqual(failures,[],'Empty/whitespace option labels, including disabled items, must reject before SSR markup')
 const label='  Same label  '
 const source=html([{label,value:'a'},{label,value:'b'}])
 assert.deepEqual(nativeLabels(source),[label,label],'Legal label whitespace and repeated labels with distinct values are preserved')
 assert.match(source,/data-part="value-text"/)
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 console.log('PASS no-DOM option label SSR')
}else for(const framework of ['solid','svelte'])test(`Ready ${framework} SSR rejects empty option labels and preserves legal label text`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-option-label-ssr-'))
 try{
  const {build}=await import('vite');let plugin,code
  if(framework==='solid'){
   plugin=(await import('vite-plugin-solid')).default({ssr:true})
   code=`import {renderToString} from 'solid-js/web';import {createComponent} from 'solid-js';import {Select} from '${root}packages/ready/solid';export const html=options=>renderToString(()=>createComponent(Select,{label:'Choice',name:'choice',value:'a',options}));`
  }else{
   plugin=(await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false})
   await writeFile(join(folder,'Fixture.svelte'),`<script>import {Select} from '${root}packages/ready/svelte';let {options}=$props();</script><Select label="Choice" name="choice" value="a" {options}/>`)
   code=`import {render} from 'svelte/server';import Fixture from './Fixture.svelte';export const html=options=>render(Fixture,{props:{options}}).body;`
  }
  const entry=join(folder,'server.mjs');await writeFile(entry,code)
  await build({root,configFile:false,logLevel:'error',plugins:[plugin],ssr:{noExternal:true},build:{ssr:entry,outDir:join(folder,'out'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs',inlineDynamicImports:true}}}})
  const result=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'out/server.mjs')],{cwd:root,encoding:'utf8',timeout:30000});assert.match(result,/PASS no-DOM option label SSR/)
 }finally{await rm(folder,{recursive:true,force:true})}
})
