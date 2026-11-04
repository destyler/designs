import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const helper = ts.transpileModule(await read('examples/shadcn/components/source-view.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const { extractAdapterSource, tokenizeSource } = await import(`data:text/javascript;base64,${Buffer.from(helper).toString('base64')}`)

test('focused adapter excerpts are exact, ordered slices of the actual running sources', async () => {
  for (const [framework, file] of [['react', 'ReactDemo.tsx'], ['vue', 'VueDemo.vue']]) {
    const source = await read(`examples/shadcn/adapters/${file}`)
    const lines = source.split('\n')
    assert.equal(extractAdapterSource(source, framework, 'settings')[0].code, source, `${framework}: settings exposes the complete file`)
    for (const component of ['switch', 'checkbox', 'tabs', 'dialog']) {
      const excerpts = extractAdapterSource(source, framework, component)
      assert.ok(excerpts.length, `${framework}/${component}: excerpts exist`)
      let lastEnd = 0
      for (const excerpt of excerpts) {
        assert.ok(excerpt.startLine > lastEnd, 'Excerpts are ordered and do not overlap')
        assert.ok(excerpt.endLine >= excerpt.startLine, 'Excerpts contain source lines')
        assert.equal(excerpt.code, lines.slice(excerpt.startLine - 1, excerpt.endLine).join('\n'), `${framework}/${component}: line range matches source bytes`)
        lastEnd = excerpt.endLine
      }
      const code = excerpts.map(excerpt => excerpt.code).join('\n')
      const primitive = component[0].toUpperCase() + component.slice(1)
      assert.ok(code.includes(`<${primitive}.`), `${framework}/${component}: excerpt contains the selected primitive`)
      assert.ok(code.length < source.length, `${framework}/${component}: focused view is smaller than the full adapter`)
    }
  }
})

test('source highlighting preserves every byte, including long CSS and hostile-looking text', () => {
  const samples = [
    '',
    'import { Switch } from "@destyler-ui/react"\n// comment\n<Switch.Root checked={true}> & <script>alert(1)</script>',
    '/* Zinc */\n[data-design="shadcn"] { --radius: 0.625rem; color: red; }\n',
    "'unterminated string\n<!-- comment without close",
    'const value = "x";\n'.repeat(20_000),
    '/*'.repeat(40_000),
  ]
  for (const sample of samples) {
    const tokens = tokenizeSource(sample)
    assert.equal(tokens.map(token => token.text).join(''), sample, 'Highlighting does not alter displayed or copied source')
    assert.ok(tokens.length <= 12_002, 'Highlight token count stays bounded')
  }
})
