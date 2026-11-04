import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import reactSource from '../vanilla-extract/react/Showcase.tsx?raw'
import vueSource from '../vanilla-extract/vue/Showcase.vue?raw'
import solidSource from '../vanilla-extract/solid/Showcase.tsx?raw'
import svelteSource from '../vanilla-extract/svelte/Showcase.svelte?raw'
import styleSource from '../../packages/vanilla-extract/src/styles.css.ts?raw'
import compiledCss from '../../packages/vanilla-extract/dist/styles.css?raw'
import sharedSource from '../vanilla-extract/shared/showcase.ts?raw'
import layoutSource from '../vanilla-extract/shared/showcase.css?raw'
import { tokenizeSource } from '../shadcn/components/source-view'
import type { Example } from './main'

export const frameworks = { react: 'React', vue: 'Vue', solid: 'Solid', svelte: 'Svelte' } as const
export type Framework = keyof typeof frameworks
const extensions = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
const sources = { react: reactSource, vue: vueSource, solid: solidSource, svelte: svelteSource }
type File = 'component' | 'styles' | 'css' | 'shared' | 'layout'
export function SourceInspector({ framework, example }: { framework: Framework; example: Example }) {
  const [file, setFile] = useState<File>('component')
  const [copied, setCopied] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const files = {
    component: { label: `${frameworks[framework]} component`, path: `examples/vanilla-extract/${framework}/Showcase.${extensions[framework]}`, code: sources[framework], note: `Actual ${frameworks[framework]} preview source, including Switch and Dialog.` },
    styles: { label: 'Style definitions', path: 'packages/vanilla-extract/src/styles.css.ts', code: styleSource, note: 'Shared vanilla-extract definitions. Compiled once in the style package.' },
    css: { label: 'Compiled CSS', path: 'packages/vanilla-extract/dist/styles.css', code: compiledCss, note: 'Exact standalone package CSS loaded by every framework. No page stylesheet mixed in.' },
    shared: { label: 'Shared data', path: 'examples/vanilla-extract/shared/showcase.ts', code: sharedSource, note: 'Shared demo content and validated preview messages.' },
    layout: { label: 'Example layout', path: 'examples/vanilla-extract/shared/showcase.css', code: layoutSource, note: 'Demo card layout. Switch and Dialog styles come from the package.' },
  }
  const selected = files[file]
  const tokens = useMemo(() => tokenizeSource(selected.code), [selected.code])
  useEffect(() => { setCopied(''); return () => clearTimeout(timer.current) }, [file, framework])
  async function copy() {
    try { await navigator.clipboard.writeText(selected.code); setCopied('Copied') }
    catch { setCopied('Select the code to copy it.') }
    clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(''), 4000)
  }
  return <div className="showcase-source" aria-label={`${frameworks[framework]} ${example} source`}>
    <div className="source-file-controls"><label className="sr-only" htmlFor="source-file">Source file</label><select id="source-file" value={file} onChange={event => setFile(event.target.value as File)}>{Object.entries(files).map(([id, item]) => <option value={id} key={id}>{item.label}</option>)}</select><div className="source-file-actions"><a href={`https://github.com/destyler/designs/blob/main/${selected.path}`} title="Open full source" aria-label="Open full source on GitHub"><ExternalLink size={14}/></a><button onClick={copy} title="Copy source" aria-label="Copy source">{copied === 'Copied' ? <Check size={14}/> : <Copy size={14}/>}</button></div></div>
    <p className="showcase-source-note">{selected.note}</p>
    <pre data-testid="css-source" tabIndex={0} aria-label={selected.path}><code>{tokens.map((token, index) => token.kind ? <span key={index} className={`syntax-${token.kind}`}>{token.text}</span> : token.text)}</code></pre>
    <span className="source-copy-status" role="status">{copied}</span>
  </div>
}
