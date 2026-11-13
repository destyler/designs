// Static stylesheet contract, not computed layout or browser scrolling acceptance.
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const css=await readFile(new URL('../packages/ready/theme.css',import.meta.url),'utf8')
test('Ready Select long lists are bounded and vertically scrollable in every theme',()=>{
 const match=css.match(/\.rd-component \[data-scope="select"\]\[data-part="content"\]\s*\{([^}]+)\}/)
 assert.ok(match,'Shared content selector exists')
 const declarations=Object.fromEntries(match[1].split(';').filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':');return [s.slice(0,i).trim(),s.slice(i+1).trim()]}))
 assert.equal(declarations['max-height'],'min(20rem,var(--available-height,20rem))')
 assert.equal(declarations['overflow-y'],'auto')
 assert.equal(declarations['overscroll-behavior'],'contain')
 assert.equal((css.match(/max-height:min\(20rem,var\(--available-height,20rem\)\)/g)||[]).length,1,'One shared declaration, not per-theme branches')
})
