import {build} from 'vite'
import react from '@vitejs/plugin-react'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url))
await build({configFile:false,root:resolve(root,'examples/ready-docs'),base:'./',plugins:[react()],build:{outDir:resolve(root,'artifacts/ready-docs'),emptyOutDir:true}})
