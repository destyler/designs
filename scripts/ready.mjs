import { build, createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url))
export async function readyConfig(framework) {
 const plugins={react:()=>import('@vitejs/plugin-react').then(m=>m.default()),vue:()=>import('@vitejs/plugin-vue').then(m=>m.default()),solid:()=>import('vite-plugin-solid').then(m=>m.default()),svelte:()=>import('@sveltejs/vite-plugin-svelte').then(m=>m.svelte())}
 if(!plugins[framework]) throw Error('Choose react, vue, solid or svelte')
 return { configFile:false,root:resolve(root,'examples/ready',framework),base:'./',plugins:[await plugins[framework]()],server:{host:'127.0.0.1',fs:{allow:[root]}},build:{outDir:resolve(root,'artifacts/ready',framework),emptyOutDir:true} }
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const [command='dev',framework='react']=process.argv.slice(2)
 if(command==='build') for(const name of ['react','vue','solid','svelte']) await build(await readyConfig(name))
 else if(command==='dev') {const server=await createServer(await readyConfig(framework));await server.listen();server.printUrls()}
 else throw Error('Use dev [framework] or build')
}
