import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
test('Ready themes share the same semantic contract with distinct geometry and typography',async()=>{
 const css=await readFile(new URL('../packages/ready/theme.css',import.meta.url),'utf8')
 const blocks=[...css.matchAll(/\[data-rd-theme(?:="midnight")?\]\s*\{([^}]+)\}/g)].map(m=>m[1]);assert.equal(blocks.length,2)
 const tokens=block=>Object.fromEntries([...block.matchAll(/(--rd-[\w-]+):([^;]+);/g)].map(m=>[m[1],m[2]]))
 const [a,b]=blocks.map(tokens);assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort());assert.equal(Object.keys(a).length,14)
 for(const token of ['--rd-radius','--rd-font','--rd-space','--rd-control-height','--rd-shadow'])assert.notEqual(a[token],b[token])
 assert.ok(!/(?:^|\n)body\s/.test(css));assert.ok(!css.includes(':root'));assert.ok(css.includes('background:var(--rd-backdrop,#10182780)'));assert.ok(css.includes('z-index:calc(var(--rd-overlay-z,40) + 1)'))
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

test('Unscoped components consume complete defaults without shadowing inherited custom tokens',async()=>{
 const css=await readFile(new URL('../packages/ready/theme.css',import.meta.url),'utf8')
 const scope=css.match(/\[data-rd-theme\]\s*\{([^}]+)\}/)
 const defaults=Object.fromEntries([...scope[1].matchAll(/(--rd-[\w-]+):([^;]+);/g)].map(m=>[m[1],m[2]]))
 const componentCss=css.slice(css.indexOf('.rd-component'))
 for(const [,token] of componentCss.matchAll(/var\((--rd-[\w-]+)/g)) {
  assert.ok(componentCss.includes(`var(${token},${defaults[token]})`), `${token} has the same default as the explicit scope`)
 }
 assert.doesNotMatch(componentCss,/var\(--rd-[\w-]+\)/,'Every Ready token consumption has a fallback')
 assert.doesNotMatch(componentCss,/--rd-[\w-]+\s*:/,'Component roots must not shadow inherited scope/custom values')
 assert.doesNotMatch(css,/:root|@property/,'No global defaults or registered custom properties')
 assert.doesNotMatch(css,/(?:^|\n)\s*(?:html|body|button|input)\s*[{,]/,'No host/global element styling')
 assert.ok(css.includes('background:var(--rd-surface,#fff)'))
 assert.ok(css.includes('calc(var(--rd-radius,10px) / 2)'))
})

test('Imported family sheets honor the same 14 default tokens and pack with the CSS entry',async()=>{
 const dir=new URL('../packages/ready/',import.meta.url)
 const css=await readFile(new URL('theme.css',dir),'utf8')
 const scope=css.match(/\[data-rd-theme\]\s*\{([^}]+)\}/)
 const defaults=Object.fromEntries([...scope[1].matchAll(/(--rd-[\w-]+):([^;]+);/g)].map(match=>[match[1],match[2]]))
 const normalize=value=>value.replace(/,\s*/g,',').trim()
 const manifest=JSON.parse(await readFile(new URL('package.json',dir),'utf8'))
 const imports=[...css.matchAll(/^@import "\.\/([^"]+\.css)";/gm)].map(match=>match[1])
 assert.ok(imports.length>=8, 'all composed family sheets are brought in by theme.css')
 for(const sheet of imports){
  assert.ok(manifest.files.includes(sheet),`${sheet} is packed`)
  const text=await readFile(new URL(sheet,dir),'utf8')
  assert.doesNotMatch(text,/--rd-[\w-]+\s*:/,`${sheet} must not override the inherited scope`)
  assert.doesNotMatch(text,/var\(--rd-[\w-]+\)/,`${sheet} provides defaults even without the theme wrapper`)
  for(const [,token,fallback] of text.matchAll(/var\((--rd-[\w-]+),([^()]+)\)/g)){
   assert.ok(token in defaults,`${sheet}: undocumented token ${token}`)
   assert.equal(normalize(fallback),normalize(defaults[token]),`${sheet}: default for ${token} matches explicit theme`)
  }
 }
})
