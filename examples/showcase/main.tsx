import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUpRight, ChevronDown, ChevronRight, Code2, Moon, PanelsTopLeft, Plus, Sun } from 'lucide-react'
import { SourceInspector, frameworks, type Framework } from './source'

const source = 'https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui'
const examples = {
  switch: { title: 'Switch', category: 'Form controls', description: 'A control that switches between two states.', number: '01', key: 'Space', action: 'Toggle a focused switch' },
  dialog: { title: 'Dialog', category: 'Overlays', description: 'A window that asks for your attention.', number: '02', key: 'Esc', action: 'Close and return focus' },
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

export default function Comparison() {
  const [example, setExample] = useState<Example>('switch')
  const [framework, setFramework] = useState<Framework>('react')
  const [modes, setModes] = useState({ reference: false, destyler: false })
  const [showCode, setShowCode] = useState(false)
  useEffect(() => { const update = () => setExample(currentExample()); update(); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  const selected = examples[example]
  function selectView(code: boolean, focus = false) { setShowCode(code); if (focus) document.getElementById(code ? 'code-tab' : 'preview-tab')?.focus() }
  function navigateView(event: KeyboardEvent, code: boolean) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault(); selectView(event.key === 'Home' ? false : event.key === 'End' ? true : !code, true)
  }
  return <>
        <div className="page-breadcrumb"><span>Components</span><ChevronRight size={12}/><span>{selected.category}</span></div>
        <div className="page-intro"><div><h1>{selected.title}</h1><p>{selected.description}</p></div><span className="component-index" aria-hidden="true">{selected.number}<span> / 02</span></span></div>
        <div className="comparison-summary"><p>Original shadcn/ui. Real Destyler primitives.</p><div className="theme-control" role="group" aria-label="Both color modes"><button aria-label="All light" title="All light" aria-pressed={!modes.reference && !modes.destyler} onClick={() => setModes({ reference: false, destyler: false })}><Sun size={15}/></button><button aria-label="All dark" title="All dark" aria-pressed={modes.reference && modes.destyler} onClick={() => setModes({ reference: true, destyler: true })}><Moon size={15}/></button></div></div>
        <div className="comparison-grid" data-example={example}>
          <section className="demo-panel reference-panel" data-demo="reference" aria-label="shadcn/ui preview">
            <div className="panel-heading"><div className="panel-identity"><span className="shadcn-mark" aria-hidden="true">╱╱</span><h2>shadcn/ui</h2><span className="panel-badge">ORIGINAL</span></div><button aria-label="Toggle shadcn/ui color mode" aria-pressed={modes.reference} title="Toggle shadcn/ui color mode" className="panel-mode" onClick={() => setModes(state => ({ ...state, reference: !state.reference }))}>{modes.reference ? <Moon size={15}/> : <Sun size={15}/>}</button></div>
            <div className="reference-toolbar"><span>React · Radix</span><span className="reference-fixed"><span className="small-status"/>Fixed reference</span></div>
            <FrameworkPreview reference framework="react" example={example} dark={modes.reference}/>

            <div className="panel-caption"><span>Original New York v4 components</span><a href={`${source}/${example}.tsx`} aria-label={`View original shadcn ${example} source`}>Source <ArrowUpRight size={12}/></a></div>
          </section>
          <section className="demo-panel destyler-panel" data-demo="destyler" data-framework={framework} aria-label="Destyler comparison">
            <div className="panel-heading"><div className="panel-identity"><Mark small/><h2>Destyler</h2><span className="panel-badge">ADAPTED</span></div><button aria-label="Toggle Destyler color mode" aria-pressed={modes.destyler} title="Toggle Destyler color mode" className="panel-mode" onClick={() => setModes(state => ({ ...state, destyler: !state.destyler }))}>{modes.destyler ? <Moon size={15}/> : <Sun size={15}/>}</button></div>
            <div className="destyler-toolbar"><div className="preview-controls" role="tablist" aria-label="Destyler view"><button id="preview-tab" role="tab" aria-selected={!showCode} aria-controls="preview-panel" tabIndex={!showCode ? 0 : -1} onClick={() => selectView(false)} onKeyDown={event => navigateView(event, false)}><PanelsTopLeft size={14}/>Preview</button><button id="code-tab" role="tab" aria-selected={showCode} aria-controls="code-panel" tabIndex={showCode ? 0 : -1} onClick={() => selectView(true)} onKeyDown={event => navigateView(event, true)}><Code2 size={15}/>Code</button></div><div className="select-wrap"><select id="framework" aria-label="Destyler framework" value={framework} onChange={event => setFramework(event.target.value as Framework)}>{Object.entries(frameworks).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><ChevronDown size={12} aria-hidden="true"/></div></div>
            <div id="preview-panel" role="tabpanel" aria-labelledby="preview-tab" hidden={showCode}><FrameworkPreview key={framework} framework={framework} example={example} dark={modes.destyler}/></div>
            <div id="code-panel" role="tabpanel" aria-labelledby="code-tab" hidden={!showCode}><SourceInspector framework={framework} example={example}/></div>
            <div className="panel-caption"><span>@destyler-ui/{framework}</span><span>vanilla-extract CSS</span></div>
          </section>
        </div>
        <div className="preview-footnote"><span><span className="live-indicator"/>{example === 'dialog' ? 'Open a dialog on either side to compare.' : 'One component. Try both sides.'}</span><span className="keyboard-hint"><kbd>{selected.key}</kbd>{selected.action}</span></div>
        <div className="comparison-context"><div><span className="context-label">SAME DESIGN. FOUR FRAMEWORKS.</span><p>The reference stays put.<br className="mobile-break"/> Switch frameworks or inspect the Destyler source.</p></div><a href="/vanilla-extract/react/">Explore tokens & overrides <ArrowUpRight size={14}/></a></div>
        <details className="implementation-notes"><summary><span>About this comparison</span><Plus size={16}/></summary><div className="details-grid"><div><h3>A fixed original</h3><p>The left uses pinned, unmodified shadcn/ui components on React and Radix. Changing the right framework does not remount or restyle it.</p></div><div><h3>Actual framework code</h3><p>Switch and Dialog use published Destyler React, Vue, Solid or Svelte primitives. Each preview is isolated. Select Open dialog to open it inside that canvas; Escape or Close dismisses it and returns focus.</p></div><div><h3>Precompiled styles</h3><p>Astro renders the site. All four adapters still share the existing vanilla-extract CSS; the CSS-only migration is not implemented. Code is read from the actual source files. This is a two-component prototype, not a complete component collection.</p></div></div></details>
  </>
}
