// Build the very same examples displayed in the docs with each native compiler.
import { build } from 'vite'
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { frameworks, snippet, controlledSelectSnippet } from '../examples/ready-docs/content.ts'
import { readyConfig } from './ready.mjs'
export async function buildDocsPreviews(root, outDir) {
 const temp=await mkdtemp(join(root,'node_modules/.docs-previews-'))
 try {
  for(const framework of frameworks){
   const name=framework.toLowerCase(), dir=join(temp,name);await mkdir(dir)
   const extension=({Vue:'vue',Svelte:'svelte'})[framework]||'tsx'
   const input={}
   for(const component of ['Checkbox','Select','Dialog','ControlledSelect']){
    const id=component.toLowerCase();input[id]=join(dir,`${id}.html`)
    const source=(component==='ControlledSelect'?controlledSelectSnippet(framework):snippet(framework,component)).replaceAll(`@destyler/ready-prototype/${name}`,resolve(root,`packages/ready/${name}/index.${name==='react'||name==='solid'?'tsx':'ts'}`))
    await writeFile(join(dir,`${id}.${extension}`),source)
    const mount={React:`import {createRoot} from 'react-dom/client';createRoot(document.getElementById('app')).render(<Example/>);`,Vue:`import {createApp} from 'vue';const app=createApp(Example);app.config.idPrefix='docs-${id}';app.mount('#app');`,Solid:`import {render} from 'solid-js/web';render(()=> <Example/>,document.getElementById('app'));`,Svelte:`import {mount} from 'svelte';mount(Example,{target:document.getElementById('app')});`}[framework]
    await writeFile(join(dir,`${id}-entry.tsx`),`import Example from './${id}.${extension}';import '${resolve(root,'packages/ready/theme.css')}';import '${resolve(root,'examples/ready-docs/frame.css')}';import {connectPreview} from '${resolve(root,'examples/ready-docs/preview-channel.ts')}';${mount}\nconnectPreview('${framework}','${id}');`)
    await writeFile(input[id],`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${framework} ${component} preview</title></head><body data-rd-theme="default"><main id="app"></main><script type="module" src="./${id}-entry.tsx"></script></body></html>`)
   }
   const config=await readyConfig(name)
   await build({...config,root:dir,build:{outDir:join(outDir,'previews',name),emptyOutDir:true,rollupOptions:{input}}})
  }
 }finally{await rm(temp,{recursive:true,force:true})}
}
