import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
const root=fileURLToPath(new URL('../',import.meta.url))
const message='Ready Select: option.label must contain non-whitespace text.'
if(process.argv[2]==='--server'){
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined')
 const {render}=await import(pathToFileURL(process.argv[3]))
 const valid=[{value:'a',label:'  Shared label  '},{value:'b',label:'  Shared label  '}]
 const html=await render(valid)
 // Server serialization preserves the exact supplied text; no DOM or browser involved.
 assert.equal([...html.matchAll(/<option\b[^>]*>  Shared label  <\/option>/g)].length,2);assert.ok(html.includes('value="a"'));assert.ok(html.includes('value="b"'))
 for(const label of ['', ' \t\n '])for(const disabled of [false,true]){
  await assert.rejects(async()=>render([{value:'a',label,disabled}]),{message})
 }
 console.log('PASS Ready option label SSR')
}else for(const framework of ['react','vue'])test(`Ready ${framework} SSR rejects blank option labels and preserves valid text`,{timeout:120000},async()=>{
 const folder=await mkdtemp(join(root,'node_modules/.ready-option-label-ssr-'))
 try{
  const source=`${root}packages/ready/${framework}`
  const code=framework==='react'?`import {createElement as h} from 'react';import {renderToString} from 'react-dom/server';import {Select} from '${source}';export const render=options=>renderToString(h(Select,{label:'Choice',value:'a',options}))`:`import {createSSRApp,h} from 'vue';import {renderToString} from '@vue/server-renderer';import {Select} from '${source}';export const render=options=>renderToString(createSSRApp({render:()=>h(Select,{label:'Choice',value:'a',options})}))`
  const plugin=framework==='react'?(await import('@vitejs/plugin-react')).default():(await import('@vitejs/plugin-vue')).default()
  const entry=join(folder,'server.mjs');await writeFile(entry,code)
  const {build}=await import('vite');await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{ssr:entry,outDir:join(folder,'out'),minify:false,rollupOptions:{output:{entryFileNames:'server.mjs'}}}})
  const output=execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--server',join(folder,'out/server.mjs')],{cwd:root,encoding:'utf8',timeout:30000})
  assert.match(output,/PASS Ready option label SSR/)
 }finally{await rm(folder,{recursive:true,force:true})}
})
