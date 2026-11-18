// Packed-source type contracts. --locked links the repository's npm ci dependencies;
// a directory argument links prior clean consumers' dependencies instead.
// Ready always comes from this run's tarball. Neither mode installs dependencies;
// locked mode is not framework-peer isolation or a fresh installation.
// Obtain prior consumers using scripts/verify-ready-clean-consumers.mjs.
import assert from 'node:assert/strict'
import {stripVTControlCharacters} from 'node:util'
import {dependencyMode,linkTypeDependencies,assertPackedReady} from './ready-type-dependencies.mjs'
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('../',import.meta.url))
const mode=dependencyMode(process.argv[2],'verify-ready-types-solid-svelte.mjs')
const dependencies=mode.directory
console.log(mode.locked?'Mode: locked repository npm ci dependencies; packed Ready':'Mode: linked prior clean consumer dependencies; packed Ready')
const output=await mkdtemp('/tmp/ready-type-contract-ss-');console.log('Evidence:',output)
const run=(cmd,args,cwd)=>execFileSync(cmd,args,{cwd,encoding:'utf8',env:{...process.env,NODE_PATH:''},timeout:120000})
const [pack]=JSON.parse(run('npm',['pack','./packages/ready','--ignore-scripts','--json','--pack-destination',output,'--cache','/tmp/ready-type-cache'],root))
for(const framework of ['solid','svelte']){
 const folder=join(output,framework),modules=join(folder,'node_modules');await mkdir(modules,{recursive:true})
 const installed=mode.locked?join(root,'node_modules'):join(dependencies,framework,'node_modules')
 await linkTypeDependencies(installed,modules)
 const ready=join(modules,'@destyler/ready-prototype');await mkdir(ready,{recursive:true});run('tar',['-xzf',join(output,pack.filename),'--strip-components=1','-C',ready],folder)
 await writeFile(join(folder,'package.json'),'{"type":"module","private":true}')
 await assertPackedReady(folder,framework,run)
 const tsconfig=JSON.parse(await readFile(join(root,'examples/ready',framework,'tsconfig.json'),'utf8'));tsconfig.include=['*.ts','*.tsx','*.svelte'];tsconfig.exclude=['node_modules'];await writeFile(join(folder,'tsconfig.json'),JSON.stringify(tsconfig))
 if(framework==='svelte')await writeFile(join(folder,'svelte.config.js'),'export default {}')
 const props=framework==='solid'?`import type {ComponentProps} from 'solid-js';`:`import type {ComponentProps} from 'svelte';`
 await writeFile(join(folder,'contracts.ts'),`${props}
import {Checkbox,Select,Dialog} from '@destyler/ready-prototype/${framework}';
type C=ComponentProps<typeof Checkbox>;type S=ComponentProps<typeof Select>;type D=ComponentProps<typeof Dialog>;
const uncontrolled:C={label:'Consent',required:true,error:'Error',onCheckedChange:value=>{const boolean:boolean=value}};
const controlled:C={label:'Consent',checked:true,disabled:false,name:'check'};
const releasing:C={label:'Consent',checked:undefined};
const select:S={label:'Plan',options:[{value:'a',label:'A',disabled:false}],value:'a',required:true,error:'Error',onValueChange:value=>{const string:string=value}};
const empty:S={label:'Plan',options:[]};
const dialog:D={title:'Title',trigger:'Open',open:false,description:'',onOpenChange:value=>{const boolean:boolean=value}};
// @ts-expect-error label is required
const noLabel:C={};
// @ts-expect-error checked is boolean
const wrongChecked:C={label:'C',checked:'mixed'};
// @ts-expect-error callback receives boolean, not a DOM event
const wrongCheckCallback:C={label:'C',onCheckedChange:(event:Event)=>{}};
// @ts-expect-error required is boolean
const wrongRequired:C={label:'C',required:'yes'};
// @ts-expect-error error is text
const wrongError:S={label:'S',options:[],error:true};
// @ts-expect-error option values are strings
const wrongValue:S={label:'S',options:[{label:'A',value:1}]};
// @ts-expect-error options are required
const noOptions:S={label:'S'};
// @ts-expect-error option disabled is boolean
const wrongDisabled:S={label:'S',options:[{label:'A',value:'a',disabled:'yes'}]};
// @ts-expect-error Select callback receives string
const wrongSelectCallback:S={label:'S',options:[],onValueChange:(value:boolean)=>{}};
// @ts-expect-error defaultValue is not part of this pilot's API
const unsupportedDefault:S={label:'S',options:[],defaultValue:'a'};
// @ts-expect-error title is required
const noTitle:D={trigger:'Open'};
// @ts-expect-error open is boolean
const wrongOpen:D={title:'Title',trigger:'Open',open:'true'};
// @ts-expect-error extra DOM props are not broadly forwarded
const extra:C={label:'C','aria-label':'Alternative'};
`)
 const markup=framework==='solid'?`import {Checkbox,Select,Dialog} from '@destyler/ready-prototype/solid';export const fixture=<><Checkbox label="Consent" required error="Error" onCheckedChange={value=>{const v:boolean=value}}/><Select label="Plan" options={[{label:'A',value:'a'}]} onValueChange={value=>{const v:string=value}}/><Dialog title="Title" trigger="Open" onOpenChange={value=>{const v:boolean=value}}>Body</Dialog></>;`:`<script lang="ts">import {Checkbox,Select,Dialog} from '@destyler/ready-prototype/svelte';</script><Checkbox label="Consent" required error="Error" onCheckedChange={value=>{const v:boolean=value}}/><Select label="Plan" options={[{label:'A',value:'a'}]} onValueChange={value=>{const v:string=value}}/><Dialog title="Title" trigger="Open" onOpenChange={value=>{const v:boolean=value}}>Body</Dialog>`
 await writeFile(join(folder,framework==='solid'?'Fixture.tsx':'Fixture.svelte'),markup)
 const args=framework==='solid'?[join(installed,'typescript/bin/tsc'),'--noEmit','-p',join(folder,'tsconfig.json')]:[join(installed,'svelte-check/bin/svelte-check'),'--workspace',folder,'--tsconfig',join(folder,'tsconfig.json')]
 try{const log=run(process.execPath,args,folder);await writeFile(join(folder,'types.log'),log);console.log(framework,'PASS packed positive markup + 13 expected negative type cases')}
 catch(e){await writeFile(join(folder,'types.log'),String(e.stdout)+String(e.stderr));console.log(framework,'FAIL',String(e.stdout));process.exitCode=1}
 const contract=await readFile(join(folder,'contracts.ts'),'utf8');const expectedLines=contract.split('\n').flatMap((line,index)=>line.includes('@ts-expect-error')?[index+2]:[])
 assert.equal(expectedLines.length,13)
 await writeFile(join(folder,'contracts.ts'),contract.replaceAll('@ts-expect-error','negative case'))
 let negative;try{run(process.execPath,args,folder);throw Error('Invalid cases unexpectedly compiled')}catch(e){if(!e.status)throw e;negative=stripVTControlCharacters(String(e.stdout)+String(e.stderr)).replaceAll('\r\n','\n')}
 // Hosted CI may color filenames/Error prefixes. Preserve strict diagnostics after removing presentation escapes.
 await writeFile(join(folder,'negative.log'),negative)
 const pattern=framework==='solid'?/contracts\.ts\((\d+),\d+\): error /g:/contracts\.ts:(\d+):\d+\nError:/g
 const lines=[...negative.matchAll(pattern)].map(match=>Number(match[1]));assert.deepEqual(lines,expectedLines,'Exactly one diagnostic at each intended negative fixture line')
 if(framework==='svelte')assert.match(negative,/found 13 errors and 0 warnings/)
 else assert.equal((negative.match(/error TS/g)||[]).length,13)
 await writeFile(join(folder,'contracts.ts'),contract)
 console.log(framework,'PASS exact 13 diagnostic locations and packed export resolution')
 const pkg=JSON.parse(await readFile(join(ready,'package.json'),'utf8'));assert.ok(pkg.exports['./'+framework]);assert.ok(pkg.files.includes('accessible-text.ts'))
}
