import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const source=await readFile(new URL('../packages/ready/accessible-text.ts',import.meta.url),'utf8')
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}})
const {validateAccessibleText}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'))
test('Required naming text rejects blank input without rewriting valid text',()=>{
 for(const [component,prop] of [['Checkbox','label'],['Select','label'],['Dialog','trigger'],['Dialog','title'],['Dialog','closeLabel'],['Select','emptyMessage']]){
  for(const value of ['', ' ', '\n\t', '\u00a0', null, undefined])assert.throws(()=>validateAccessibleText(value,component,prop),{message:`Ready ${component}: ${prop} must contain non-whitespace text.`})
  for(const value of ['0',' 选项 ',' اختيار ','Save'])assert.equal(validateAccessibleText(value,component,prop),value)
 }
})
test('Required naming validation ships with the packed source package',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../packages/ready/package.json',import.meta.url),'utf8'))
 assert.ok(pkg.files.includes('accessible-text.ts'))
})
