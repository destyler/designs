import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUpRight, ChevronRight, Code2, Moon, PanelsTopLeft, Sun } from 'lucide-react'
import { SourceInspector, frameworks, type Framework } from './source'

const source = 'https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui'
const examples = {
  switch: { title: 'Switch', category: 'Form controls', description: 'A control that switches between two states.', key: 'Space', action: 'Toggle a focused switch' },
  dialog: { title: 'Dialog', category: 'Overlays', description: 'A window that asks for your attention.', key: 'Esc', action: 'Close and return focus' },
} as const
export type Example = keyof typeof examples
function currentExample(): Example { return window.location.hash === '#dialog' ? 'dialog' : 'switch' }
function Mark({ small = false }: { small?: boolean }) { return <span className={'destyler-mark' + (small ? ' small' : '')} aria-hidden="true"><i/><i/><i/></span> }

function FrameworkPreview({ framework, example, dark, reference = false }: { framework: Framework; example: Example; dark: boolean; reference?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // Preserve the frame on theme/component changes. Only changing framework resets its state.
  const [initial] = useState({ example, dark })
  const url = reference ? `/reference/?component=${initial.example}&theme=${initial.dark ? 'dark' : 'light'}` : `/vanilla-extract/${framework}/?showcase=1&component=${initial.example}&theme=${initial.dark ? 'dark' : 'light'}`
  const label = reference ? 'shadcn/ui' : `Destyler ${frameworks[framework]}`
  useEffect(() => {
    setReady(false); setFailed(false)
    const timer = window.setTimeout(() => setFailed(true), 15000)
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== 'destyler:ready') return
      clearTimeout(timer); setReady(true); setFailed(false)
    }
    window.addEventListener('message', receive)
    frame.current?.contentWindow?.postMessage({ type: 'destyler:connect' }, location.origin)
    return () => { clearTimeout(timer); window.removeEventListener('message', receive) }
  }, [framework, attempt])
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: 'destyler:showcase', component: example, theme: dark ? 'dark' : 'light' }, location.origin)
  }, [ready, example, dark])
  return <div className={'framework-preview' + (dark ? ' dark' : '')}>
    <iframe key={attempt} ref={frame} src={url} title={`${label} ${examples[example].title} preview`} className="framework-frame" aria-busy={!ready} />
    {!ready && <div className="preview-loading" role="status">{failed ? <><p>The {label} preview did not load.</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button><a href={url}>Open preview separately <ArrowUpRight size={12}/></a></> : `Loading ${label}…`}</div>}
  </div>
}

function ImplementationPanel({ framework, example, dark, onToggleTheme }: { framework: Framework; example: Example; dark: boolean; onToggleTheme: () => void }) {
  const [showCode, setShowCode] = useState(false)
  const label = frameworks[framework]
  function selectView(code: boolean, focus = false) {
    setShowCode(code)
    if (focus) document.getElementById(`${framework}-${code ? 'code' : 'preview'}-tab`)?.focus()
  }
  function navigateView(event: KeyboardEvent, code: boolean) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    selectView(event.key === 'Home' ? false : event.key === 'End' ? true : !code, true)
  }
  return <section className="demo-panel destyler-panel" data-demo={framework} data-framework={framework} aria-label={`${label} implementation`}>
    <div className="panel-heading"><div className="panel-identity"><Mark small/><h2>{label}</h2></div><button aria-label={`Toggle ${label} color mode`} aria-pressed={dark} title={`Toggle ${label} color mode`} className="panel-mode" onClick={onToggleTheme}>{dark ? <Moon size={15}/> : <Sun size={15}/>}</button></div>
    <div className="destyler-toolbar"><div className="preview-controls" role="tablist" aria-label={`${label} view`}>
      <button id={`${framework}-preview-tab`} role="tab" aria-selected={!showCode} aria-controls={`${framework}-preview-panel`} tabIndex={!showCode ? 0 : -1} onClick={() => selectView(false)} onKeyDown={event => navigateView(event, false)}><PanelsTopLeft size={14}/>Preview</button>
      <button id={`${framework}-code-tab`} role="tab" aria-selected={showCode} aria-controls={`${framework}-code-panel`} tabIndex={showCode ? 0 : -1} onClick={() => selectView(true)} onKeyDown={event => navigateView(event, true)}><Code2 size={15}/>Code</button>
    </div><span className="framework-package">@destyler-ui/{framework}</span></div>
    <div id={`${framework}-preview-panel`} role="tabpanel" aria-labelledby={`${framework}-preview-tab`} hidden={showCode}><FrameworkPreview framework={framework} example={example} dark={dark}/></div>
    <div id={`${framework}-code-panel`} role="tabpanel" aria-labelledby={`${framework}-code-tab`} hidden={!showCode}><SourceInspector framework={framework} example={example}/></div>
    <div className="panel-caption"><span>Shared vanilla-extract styles</span><a href={`/vanilla-extract/${framework}/`}>Playground <ArrowUpRight size={12}/></a></div>
  </section>
}

export default function Comparison() {
  const [example, setExample] = useState<Example>('switch')
  const [modes, setModes] = useState({ reference: false, react: false, vue: false, solid: false, svelte: false })
  useEffect(() => { const update = () => setExample(currentExample()); update(); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  const selected = examples[example]
  function setAllModes(dark: boolean) { setModes({ reference: dark, react: dark, vue: dark, solid: dark, svelte: dark }) }
  return <>
    <div className="page-breadcrumb"><span>Components</span><ChevronRight size={12}/><span>{selected.category}</span></div>
    <div className="page-intro"><div><h1>{selected.title}</h1><p>{selected.description}</p></div></div>
    <div className="comparison-summary"><p>The original, then every framework.</p><div className="theme-control" role="group" aria-label="All color modes"><button aria-label="All light" title="All light" aria-pressed={Object.values(modes).every(value => !value)} onClick={() => setAllModes(false)}><Sun size={15}/></button><button aria-label="All dark" title="All dark" aria-pressed={Object.values(modes).every(Boolean)} onClick={() => setAllModes(true)}><Moon size={15}/></button></div></div>
    <div className="comparison-grid" data-example={example}>
      <section className="demo-panel reference-panel" data-demo="reference" aria-label="shadcn/ui preview">
        <div className="panel-heading"><div className="panel-identity"><span className="shadcn-mark" aria-hidden="true">╱╱</span><h2>shadcn/ui</h2><span className="reference-label">Reference</span></div><button aria-label="Toggle shadcn/ui color mode" aria-pressed={modes.reference} title="Toggle shadcn/ui color mode" className="panel-mode" onClick={() => setModes(state => ({ ...state, reference: !state.reference }))}>{modes.reference ? <Moon size={15}/> : <Sun size={15}/>}</button></div>
        <FrameworkPreview reference framework="react" example={example} dark={modes.reference}/>
        <div className="panel-caption"><span>Original · React · Radix</span><a href={`${source}/${example}.tsx`} aria-label={`View original shadcn ${example} source`}>Source <ArrowUpRight size={12}/></a></div>
      </section>
      <div className="implementation-heading"><h2>Implementations</h2><p>One design. Four real frameworks.</p></div>
      <div className="implementations-grid">{(Object.keys(frameworks) as Framework[]).map(framework => <ImplementationPanel key={framework} framework={framework} example={example} dark={modes[framework]} onToggleTheme={() => setModes(state => ({ ...state, [framework]: !state[framework] }))}/>)}</div>
    </div>
    <div className="preview-footnote"><span><span className="live-indicator"/>{example === 'dialog' ? 'Open a dialog in any preview to compare.' : 'Try the switch in each preview.'}</span><span className="keyboard-hint"><kbd>{selected.key}</kbd>{selected.action}</span></div>
    <div className="docs-links"><a href={`https://ui.destyler.org/components/${example}/`}>Component documentation <ArrowUpRight size={14}/></a></div>
    <details className="implementation-notes"><summary>About these examples</summary><p>Two components are available: Switch and Dialog. The reference uses the pinned, unmodified shadcn/ui source. Every implementation uses real Destyler primitives and shared vanilla-extract styles. Each Code tab shows only that framework’s selected component, without the documentation canvas or message bridge. This remains a two-component prototype, not a complete component collection. The CSS-only migration is not implemented.</p></details>
  </>
}
