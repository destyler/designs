import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
const read = path => readFile(new URL(`../${path}`,import.meta.url),'utf8')
const app = await read('examples/shadcn/main.tsx')
const inspector = await read('examples/shadcn/components/StyleInspector.tsx')

test('comparison exposes an accessible framework selector and explicit inspector disclosure',()=>{
  assert.match(app.replace(/<br[^>]*>/g,''),/One design\. Two implementations\./)
  assert.match(app,/aria-label="Destyler framework"/)
  assert.match(app,/value="react"/)
  assert.match(app,/value="vue"/)
  assert.match(app,/aria-expanded=/)
  assert.match(app,/aria-controls="css-inspector"/)
})

test('source inspector imports actual source files instead of maintaining example snippets',async()=>{
  for(const path of ['../styles/tokens.css','../adapters/ReactDemo.tsx','../adapters/VueDemo.vue']) {
    assert.ok(inspector.includes(`from '${path}?raw'`),path)
    await access(new URL(`../examples/shadcn/components/${path}`,import.meta.url))
  }
  assert.match(inspector,/sourceRecipes/)
  assert.match(inspector,/recipes\[key\]/)
  assert.match(inspector,/role="tablist"/)
  assert.match(inspector,/role="tabpanel"/)
  assert.match(inspector,/ArrowRight/)
  assert.match(inspector,/ArrowLeft/)
})

test('compiled CSS identifies and fetches the applied stylesheet with error handling',()=>{
  assert.match(inspector,/link\[rel="stylesheet"\]/)
  assert.match(inspector,/fetch\(href/)
  assert.match(inspector,/response\.ok/)
  assert.match(inspector,/text\/css/)
  assert.match(inspector,/AbortController/)
  assert.match(inspector,/Applied production stylesheet/)
  assert.match(inspector,/full page stylesheet, not a standalone component package/)
  assert.match(inspector,/role="alert"/)
  assert.match(inspector,/Clipboard unavailable/)
})
