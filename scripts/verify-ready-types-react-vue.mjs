// Opt-in consumer type audit. Reuses a prior clean npm consumer's installed peers,
// copied (not linked) outside this repository; no claim of a fresh network install.
// Generate the prerequisite with scripts/verify-ready-clean-consumers.mjs.
import assert from 'node:assert/strict'
import {mkdtemp,mkdir,cp,rm,writeFile,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('../',import.meta.url))
const dependencies=process.argv[2]
assert.ok(dependencies,'Usage: node scripts/verify-ready-types-react-vue.mjs /tmp/ready-clean-consumers-EXISTING')
const evidence=await mkdtemp('/tmp/ready-consumer-types-rv-');console.log(evidence)
const run=(command,args,cwd)=>execFileSync(command,args,{cwd,encoding:'utf8',env:{...process.env,NODE_PATH:''}})
const [pack]=JSON.parse(run('npm',['pack','./packages/ready','--ignore-scripts','--json','--pack-destination',evidence,'--cache','/tmp/ready-clean-npm-cache'],root))
for(const framework of ['react','vue']){
 const cwd=join(evidence,framework);await mkdir(cwd)
 await cp(join(dependencies,framework,'node_modules'),join(cwd,'node_modules'),{recursive:true})
 const pkg=join(cwd,'node_modules/@destyler/ready-prototype');await rm(pkg,{recursive:true,force:true});await mkdir(pkg,{recursive:true})
 run('tar',['-xzf',join(evidence,pack.filename),'--strip-components=1','-C',pkg],cwd)
 await writeFile(join(cwd,'package.json'),JSON.stringify({private:true,type:'module'}))
 const base={compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',strict:true,skipLibCheck:true,noEmit:true,lib:['ES2022','DOM','DOM.Iterable'],jsx:'react-jsx',esModuleInterop:true},include:['positive.tsx','positive.vue','contract.ts']}
 await writeFile(join(cwd,'tsconfig.json'),JSON.stringify(base))
 const importPath=`@destyler/ready-prototype/${framework}`
 let contract=`import {Checkbox,Select,Dialog} from '${importPath}';\n`
 contract+=framework==='react'?`import type {ComponentProps} from 'react';type C=ComponentProps<typeof Checkbox>;type S=ComponentProps<typeof Select>;type D=ComponentProps<typeof Dialog>;\n`:`type C=InstanceType<typeof Checkbox>['$props'];type S=InstanceType<typeof Select>['$props'];type D=InstanceType<typeof Dialog>['$props'];\n`
 contract+=`import type {Option} from '@destyler/ready-prototype/types';
const options:Option[]=[{value:'a',label:'A',disabled:true}];
const cb:C={label:'Consent',checked:true,required:true,error:'Required',onCheckedChange(value){const boolean:boolean=value;}};
const uncb:C={label:'Consent'};
const select:S={label:'Plan',options,value:'a',required:true,error:'Invalid',onValueChange(value){const string:string=value;}};
const uns:S={label:'Plan',options};
const dialog:D={trigger:'Open',title:'Title',open:false,onOpenChange(value){const boolean:boolean=value;}};
const und:D={trigger:'Open',title:'Title'};
// @ts-expect-error required label
const missing:C={};
// @ts-expect-error checked is boolean
const wrongChecked:C={label:'Consent',checked:'true'};
// @ts-expect-error checkbox callback payload boolean, not DOM Event
const wrongCallback:C={label:'Consent',onCheckedChange(value:Event){}};
// @ts-expect-error select value is string, not array
const wrongValue:S={label:'Plan',options,value:['a']};
// @ts-expect-error required is boolean
const wrongRequired:S={label:'Plan',options,required:'true'};
// @ts-expect-error error is string
const wrongError:C={label:'Consent',error:true};
// @ts-expect-error select callback string
const wrongSelectCallback:S={label:'Plan',options,onValueChange(value:number){}};
// @ts-expect-error option value is string
const wrongOption:S={label:'Plan',options:[{label:'A',value:1}]};
// @ts-expect-error option label required
const missingOptionLabel:S={label:'Plan',options:[{value:'a'}]};
// @ts-expect-error title required
const missingTitle:D={trigger:'Open'};
// @ts-expect-error open boolean
const wrongOpen:D={trigger:'Open',title:'Title',open:'true'};
// @ts-expect-error open callback boolean
const wrongOpenCallback:D={trigger:'Open',title:'Title',onOpenChange(value:string){}};
`
 await writeFile(join(cwd,'contract.ts'),contract)
 if(framework==='react')await writeFile(join(cwd,'positive.tsx'),`import {Checkbox,Select,Dialog} from '${importPath}';export const sample=<><Checkbox label="Consent"/><Checkbox label="Consent" checked required error="Required" onCheckedChange={value=>{const boolean:boolean=value}}/><Select label="Plan" options={[{value:'a',label:'A'}]} onValueChange={value=>{const string:string=value}}/><Dialog trigger="Open" title="Title" open={false} onOpenChange={value=>{const boolean:boolean=value}}><p>Body</p></Dialog></>`)
 else await writeFile(join(cwd,'positive.vue'),`<script setup lang="ts">import {ref} from 'vue';import {Checkbox,Select,Dialog} from '${importPath}';const checked=ref(false),value=ref(''),open=ref(false);function boolean(v:boolean){};function string(v:string){}</script><template><Checkbox label="Consent"/><Checkbox label="Consent" v-model:checked="checked" required error="Required" @checked-change="boolean"/><Select label="Plan" :options="[{value:'a',label:'A'}]" v-model:value="value" @value-change="string"/><Dialog trigger="Open" title="Title" v-model:open="open" @open-change="boolean"><p>Body</p></Dialog></template>`)
 const command=framework==='react'?'node_modules/typescript/bin/tsc':'node_modules/vue-tsc/bin/vue-tsc.js'
 try{await writeFile(join(cwd,'check.log'),run(process.execPath,[command,'--noEmit'],cwd));console.log(framework,'PASS')}catch(error){await writeFile(join(cwd,'check.log'),error.stdout??String(error));throw error}
 if(framework==='vue'){
  await writeFile(join(cwd,'negative.vue'),`<script setup lang="ts">import {Checkbox,Select,Dialog} from '${importPath}';function bad(v:number){}</script>
<template>
<Checkbox label="Consent" checked="true"/>
<Select label="Plan" :options="[]" @value-change="bad"/>
<Dialog trigger="Open"/>
</template>`)
  await writeFile(join(cwd,'negative.config.json'),JSON.stringify({...base,include:['negative.vue']}))
  let diagnostic='';try{run(process.execPath,[command,'--noEmit','-p','negative.config.json'],cwd);assert.fail('Invalid Vue template unexpectedly compiled')}catch(error){if(error.code==='ERR_ASSERTION')throw error;diagnostic=error.stdout??''}
  await writeFile(join(cwd,'negative.log'),diagnostic)
  const lines=diagnostic.split('\n').filter(line=>/^negative\.vue\(/.test(line))
  assert.equal(lines.length,3,diagnostic)
  for(const line of [3,4,5])assert.ok(lines.some(text=>text.startsWith(`negative.vue(${line},`)),diagnostic)
  assert.ok(lines.every(text=>/error TS(?:2322|2345):/.test(text)),diagnostic)
 }
 const versions={};for(const name of [framework==='react'?'react':'vue','typescript',...(framework==='vue'?['vue-tsc']:[])])versions[name]=JSON.parse(await readFile(join(cwd,'node_modules',name,'package.json'),'utf8')).version
 await writeFile(join(cwd,'versions.json'),JSON.stringify(versions,null,2))
}
