import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
test('Ready themes share the same semantic contract with distinct geometry and typography',async()=>{
 const css=await readFile(new URL('../packages/ready/theme.css',import.meta.url),'utf8')
 const blocks=[...css.matchAll(/\[data-rd-theme(?:="midnight")?\]\s*\{([^}]+)\}/g)].map(m=>m[1]);assert.equal(blocks.length,2)
 const tokens=block=>Object.fromEntries([...block.matchAll(/(--rd-[\w-]+):([^;]+);/g)].map(m=>[m[1],m[2]]))
 const [a,b]=blocks.map(tokens);assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort());assert.equal(Object.keys(a).length,14)
 for(const token of ['--rd-radius','--rd-font','--rd-space','--rd-control-height','--rd-shadow'])assert.notEqual(a[token],b[token])
 assert.ok(!/(?:^|\n)body\s/.test(css));assert.ok(!css.includes(':root'));assert.ok(css.includes('background:var(--rd-backdrop)'));assert.ok(css.includes('z-index:calc(var(--rd-overlay-z) + 1)'))
 for(const fw of ['react','vue','solid','svelte']){const html=await readFile(new URL(`../examples/ready/${fw}/index.html`,import.meta.url),'utf8');for(const theme of ['default','midnight'])assert.ok(html.includes(`data-rd-theme="${theme}"`))}
})
test('Packed theme guide documents every token and an explicit scoped override',async()=>{
 const guide=await readFile(new URL('../packages/ready/THEMING.md',import.meta.url),'utf8')
 const css=await readFile(new URL('../packages/ready/theme.css',import.meta.url),'utf8')
 const documented=[...guide.matchAll(/^\| `(--rd-[\w-]+)` \|/gm)].map(match=>match[1]).sort()
 const defined=[...new Set([...css.matchAll(/(--rd-[\w-]+):/g)].map(match=>match[1]))].sort()
 assert.deepEqual(documented,defined)
 assert.ok(guide.includes('[data-rd-theme="default"].brand-theme'))
 assert.ok(guide.includes('--rd-on-accent: #ffffff'))
 const manifest=JSON.parse(await readFile(new URL('../packages/ready/package.json',import.meta.url),'utf8'))
 assert.ok(manifest.files.includes('THEMING.md'))
})
