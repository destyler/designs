import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Copy, Download, ExternalLink, FileCode2 } from 'lucide-react'
import reactSwitch from '../css-only/react/SwitchExample.tsx?raw'
import reactDialog from '../css-only/react/DialogExample.tsx?raw'
import vueSwitch from '../css-only/vue/SwitchExample.vue?raw'
import vueDialog from '../css-only/vue/DialogExample.vue?raw'
import solidSwitch from '../css-only/solid/SwitchExample.tsx?raw'
import solidDialog from '../css-only/solid/DialogExample.tsx?raw'
import svelteSwitch from '../css-only/svelte/SwitchExample.svelte?raw'
import svelteDialog from '../css-only/svelte/DialogExample.svelte?raw'
import reactStyles from '../css-only/react/styles.ts?raw'
import vueStyles from '../css-only/vue/styles.ts?raw'
import solidStyles from '../css-only/solid/styles.ts?raw'
import svelteStyles from '../css-only/svelte/styles.ts?raw'
import packageCss from '../../packages/css-only/styles.css?raw'
import { tokenizeSource } from '../shadcn/components/source-view'
import type { Example } from './main'

export const frameworks = { react: 'React', vue: 'Vue', solid: 'Solid', svelte: 'Svelte' } as const
export type Framework = keyof typeof frameworks
const extensions = { react: 'tsx', vue: 'vue', solid: 'tsx', svelte: 'svelte' }
const sources = { react: { switch: reactSwitch, dialog: reactDialog }, vue: { switch: vueSwitch, dialog: vueDialog }, solid: { switch: solidSwitch, dialog: solidDialog }, svelte: { switch: svelteSwitch, dialog: svelteDialog } }
const imports = { react: reactStyles, vue: vueStyles, solid: solidStyles, svelte: svelteStyles }
const fileIds = ['component', 'styles', 'css'] as const
type FileId = typeof fileIds[number]
type SourceFile = { name: string; path: string; code: string; language: string; kind: string; note: string; downloadable?: boolean }

export function SourceInspector({ framework, example }: { framework: Framework; example: Example }) {
  const [file, setFile] = useState<FileId>('component')
  const [copied, setCopied] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const viewport = useRef<HTMLDivElement>(null)
  const tabs = useRef<Partial<Record<FileId, HTMLButtonElement | null>>>({})
  const componentName = example === 'switch' ? 'Switch' : 'Dialog'
  const files: Record<FileId, SourceFile> = {
    component: { name: `${componentName}Example.${extensions[framework]}`, path: `examples/css-only/${framework}/${componentName}Example.${extensions[framework]}`, code: sources[framework][example], language: extensions[framework] === 'tsx' ? 'TypeScript JSX' : frameworks[framework], kind: framework, note: `The exact ${frameworks[framework]} ${componentName} component rendered in Preview.` },
    styles: { name: 'styles.ts', path: `examples/css-only/${framework}/styles.ts`, code: imports[framework], language: 'TypeScript', kind: 'typescript', note: 'The exact CSS-only entry imported by this running consumer. No styling runtime or build plugin.' },
    css: { name: 'styles.css', path: 'packages/css-only/styles.css', code: packageCss, language: 'CSS', kind: 'css', downloadable: true, note: 'The exact distributed stylesheet. Native data-scope/data-part/state selectors, with no generated classes or page layout CSS.' },
  }
  const selected = files[file]
  const tokens = useMemo(() => tokenizeSource(selected.code), [selected.code])
  const lineCount = selected.code.split('\n').length
  useEffect(() => { setFile('component') }, [example])
  useEffect(() => {
    setCopied('')
    if (viewport.current) { viewport.current.scrollTop = 0; viewport.current.scrollLeft = 0 }
    const tab = tabs.current[file]
    const strip = tab?.parentElement
    if (tab && strip) {
      const item = tab.getBoundingClientRect(), bounds = strip.getBoundingClientRect()
      if (item.left < bounds.left) strip.scrollLeft -= bounds.left - item.left
      else if (item.right > bounds.right) strip.scrollLeft += item.right - bounds.right
    }
    return () => clearTimeout(timer.current)
  }, [file, framework, example])
  function selectFile(id: FileId, focus = false) {
    setFile(id)
    if (focus) tabs.current[id]?.focus({ preventScroll: true })
  }
  function navigateFiles(event: KeyboardEvent, id: FileId) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = fileIds.indexOf(id)
    selectFile(event.key === 'Home' ? fileIds[0] : event.key === 'End' ? fileIds.at(-1)! : fileIds[(index + (event.key === 'ArrowRight' ? 1 : -1) + fileIds.length) % fileIds.length], true)
  }
  async function copy() {
    // Guard against a clipboard promise completing after the user changes files.
    const path = selected.path
    try { await navigator.clipboard.writeText(selected.code); if (viewport.current?.dataset.path === path) setCopied('Copied') }
    catch { if (viewport.current?.dataset.path === path) setCopied('Select the code to copy it.') }
    clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(''), 4000)
  }
  function download() {
    const url = URL.createObjectURL(new Blob([selected.code], { type: selected.language === 'CSS' ? 'text/css;charset=utf-8' : 'text/javascript;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = selected.name; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="showcase-source" data-source-framework={framework} aria-label={`${frameworks[framework]} ${example} source`}>
    <div className="source-file-tabs" role="tablist" aria-label={`${frameworks[framework]} source files`}>{fileIds.map(id => <button key={id} ref={element => { tabs.current[id] = element }} id={`${framework}-source-tab-${id}`} role="tab" aria-selected={file === id} aria-controls={`${framework}-source-file-panel`} tabIndex={file === id ? 0 : -1} title={files[id].path} onClick={() => selectFile(id)} onKeyDown={event => navigateFiles(event, id)}><FileCode2 size={13} className={`file-icon file-icon-${files[id].kind}`} aria-hidden="true"/><span>{files[id].name}</span>{files[id].downloadable && <><span className="generated-dot" aria-hidden="true"/><span className="sr-only"> (stylesheet)</span></>}</button>)}</div>
    <div id={`${framework}-source-file-panel`} className="source-file-panel" role="tabpanel" aria-labelledby={`${framework}-source-tab-${file}`}>
      <div className="source-file-heading"><span className="source-file-path" title={selected.path}>{selected.path}</span><div className="source-file-actions">{selected.downloadable ? <button onClick={download} title={`Download ${selected.name}`} aria-label={`Download ${selected.name}`}><Download size={14}/></button> : <a href={`https://github.com/destyler/designs/blob/main/${selected.path}`} title="Open full source on GitHub" aria-label="Open full source on GitHub"><ExternalLink size={14}/></a>}<button onClick={copy} title="Copy source" aria-label="Copy source">{copied === 'Copied' ? <Check size={14}/> : <Copy size={14}/>}</button></div></div>
      <p id={`${framework}-source-file-note`} className="sr-only">{selected.note}</p>
      <div className="source-editor" ref={viewport} data-path={selected.path} tabIndex={0} role="region" aria-label={`${selected.name} source code`} aria-describedby={`${framework}-source-file-note`}><div className="source-line-numbers" aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}</div><pre data-testid="css-source"><code>{tokens.map((token, index) => token.kind ? <span key={index} className={`syntax-${token.kind}`}>{token.text}</span> : token.text)}</code></pre></div>
      <div className="source-status-bar"><span><span className="source-readonly-dot"/>{selected.downloadable ? 'Distributed CSS' : selected.note}</span><span className="source-copy-status" role="status">{copied}</span><span>{lineCount} lines<span className="source-status-separator">·</span>{selected.language}</span></div>
    </div>
  </div>
}
