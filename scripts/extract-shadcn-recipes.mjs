import ts from 'typescript'
import { readFile, writeFile } from 'node:fs/promises'

const files = ['tabs','switch','checkbox','label','card','button','dialog']
const recipes = {}
const variants = {}
function literal(node) { return node && ts.isStringLiteral(node) ? node.text : null }
function property(obj, name) {
  return obj.properties.find(p => p.name?.getText().replaceAll('"','').replaceAll("'",'') === name)?.initializer
}
for (const file of files) {
  const source = ts.createSourceFile(file+'.tsx', await readFile(`vendor/shadcn/new-york-v4/ui/${file}.tsx`, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(source) === 'cva') {
      const [base, config] = node.initializer.arguments
      const defaults = property(config,'defaultVariants')
      const groups = property(config,'variants')
      variants[node.name.getText(source)] = [literal(base), ...defaults.properties.map(p => literal(property(property(groups,p.name.getText(source)),p.initializer.text)))].join(' ')
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attrs = node.attributes.properties
      const slot = attrs.find(a=>a.name?.getText(source)==='data-slot')?.initializer?.text
      const style = attrs.find(a=>a.name?.getText(source)==='className')?.initializer
      if (slot && style) {
        if (ts.isStringLiteral(style)) recipes[slot]=style.text
        else if (style.expression && ts.isCallExpression(style.expression)) {
          recipes[slot]=style.expression.arguments.flatMap(a=> {
            if(ts.isStringLiteral(a)) return [a.text]
            if(ts.isCallExpression(a) && variants[a.expression.getText(source)]) return [variants[a.expression.getText(source)]]
            return []
          }).join(' ')
        }
      }
    }
    ts.forEachChild(node,visit)
  }
  visit(source)
}
recipes['button'] = variants.buttonVariants
for (const key of ['tabs','tabs-list','tabs-trigger','switch','switch-thumb','checkbox','card','button','dialog-content']) {
  if(!recipes[key]) throw new Error(`Missing upstream recipe ${key}`)
}
const adapted = {...recipes}
// Destyler controls expose disabled state on non-native preceding peers.
adapted.label=adapted.label.replaceAll('peer-disabled:','peer-data-[disabled]:')
adapted['tabs-trigger']=adapted['tabs-trigger'].replaceAll('data-[state=active]','data-[selected]')
for(const key of ['switch','checkbox']) adapted[key]=adapted[key].replaceAll('focus-visible:','data-[focus-visible]:').replaceAll('disabled:','data-[disabled]:').replaceAll('aria-invalid:','data-[invalid]:')
const output = `// GENERATED from pinned shadcn/ui sources. MIT; see vendor/shadcn/LICENSE.\n// Only behavior selectors are mapped to Destyler's public DOM state contract.\nexport const sourceRecipes = ${JSON.stringify(recipes,null,2)} as const\nexport const recipes = ${JSON.stringify(adapted,null,2)} as const\n`
await writeFile('examples/shadcn/styles/recipes.ts',output)
let css = await readFile('vendor/shadcn/zinc.css','utf8')
css=css.replace(':root {','[data-design="shadcn"] {').replace('.dark {','[data-design="shadcn"].dark {')
await writeFile('examples/shadcn/styles/tokens.css',css.replace('see ./LICENSE','see vendor/shadcn/LICENSE'))
console.log(`Extracted ${Object.keys(recipes).length} recipes; mapped tabs selection and hidden-input focus/disabled/invalid states.`)
