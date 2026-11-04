import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp, h, reactive } from 'vue'
import { Moon, Sun, ArrowUpRight, Check, Code2, ChevronDown, ChevronRight, PanelsTopLeft, ToggleRight, SquareCheck, PanelTop, SlidersHorizontal, CodeXml, Bell, Plus } from 'lucide-react'
import { ReferenceDemo } from './components/ReferenceDemo'
import { ReactDemo } from './adapters/ReactDemo'
import { StyleInspector, type Framework } from './components/StyleInspector'
import VueDemo from './adapters/VueDemo.vue'
import '@fontsource-variable/geist'
import './styles/app.css'

const source = 'https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui'
const repository = 'https://github.com/destyler/designs/tree/prototype/cloud-scoped-themes'
const examples = {
  switch: { title: 'Switch', category: 'Form controls', description: 'A simple toggle for the things that matter.', icon: ToggleRight, shortcut: 'Space', action: 'Toggle a focused switch', group: 'Components', number: '01' },
  checkbox: { title: 'Checkbox', category: 'Form controls', description: 'Make a choice. See every state.', icon: SquareCheck, shortcut: 'Space', action: 'Check or uncheck an option', group: 'Components', number: '02' },
  tabs: { title: 'Tabs', category: 'Navigation', description: 'Related views, one considered space.', icon: PanelsTopLeft, shortcut: '← →', action: 'Move between tabs', group: 'Components', number: '03' },
  dialog: { title: 'Dialog', category: 'Overlays', description: 'Bring the important things into focus.', icon: PanelTop, shortcut: 'Esc', action: 'Close and return focus', group: 'Components', number: '04' },
  settings: { title: 'Settings', category: 'Composition', description: 'A few small components. A complete experience.', icon: SlidersHorizontal, shortcut: 'Tab', action: 'Explore the controls', group: 'Patterns', number: '05' },
} as const
export type Example = keyof typeof examples
function currentExample(): Example { const value = window.location.hash.slice(1); return Object.hasOwn(examples, value) ? value as Example : 'switch' }
function VueMount({ dark, example }: { dark: boolean; example: Example }) {
  const element = useRef<HTMLDivElement>(null)
  const props = useRef(reactive({ dark, example }))
  useEffect(() => {
    const app = createApp({ render: () => h(VueDemo, props.current) })
    app.mount(element.current!)
    return () => app.unmount()
  }, [])
  useEffect(() => { props.current.dark = dark; props.current.example = example }, [dark, example])
  return <div className="demo-mount" ref={element}/>
}
function Mark({ small = false }: { small?: boolean }) {
  return <span className={'destyler-mark' + (small ? ' small' : '')} aria-hidden="true"><i/><i/><i/></span>
}
function App() {
  const [example, setExample] = useState<Example>(currentExample)
  const [framework, setFramework] = useState<Framework>('react')
  const [modes, setModes] = useState({ reference: false, react: false, vue: false })
  const [showCode, setShowCode] = useState(false)
  useEffect(() => { const update = () => { if (!window.location.hash || Object.hasOwn(examples, window.location.hash.slice(1))) setExample(currentExample()) }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  const selected = examples[example]
  const title = framework === 'react' ? 'Destyler React' : 'Destyler Vue'
  const Component = framework === 'react' ? ReactDemo : VueMount
  const panels = [
    { id: 'reference' as const, title: 'shadcn/ui', subtitle: 'React · Radix', component: ReferenceDemo },
    { id: framework, title, subtitle: `@destyler-ui/${framework}`, component: Component },
  ]
  function selectView(code: boolean, focus = false) {
    setShowCode(code)
    if (focus) document.getElementById(code ? 'code-tab' : 'preview-tab')?.focus()
  }
  function navigateView(event: React.KeyboardEvent, code: boolean) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      selectView(event.key === 'Home' ? false : event.key === 'End' ? true : !code, true)
    }
  }
  return <div className="site-shell">
    <a href="#main-content" className="skip-link">Skip to preview</a>
    <header className="site-header">
      <a href="/" className="wordmark"><Mark/><strong>destyler</strong><span className="wordmark-divider">/</span><span>designs</span></a>
      <nav aria-label="Site navigation"><span className="header-label">The component lab</span><a href={repository} className="repository-link"><CodeXml size={16}/><span>GitHub</span><ArrowUpRight size={13}/></a></nav>
    </header>
    <div className="site-layout">
      <aside className="sidebar" aria-label="Component library">
        <div className="library-choice"><span className="shadcn-mark" aria-hidden="true">╱╱</span><div><strong>shadcn/ui</strong><span>New York collection</span></div></div>
        <nav className="component-navigation" aria-label="Examples">
          {['Components', 'Patterns'].map(group => <div className="nav-group" key={group}><p>{group}<span>{group === 'Components' ? '04' : '01'}</span></p>{Object.entries(examples).filter(([, item]) => item.group === group).map(([id, item]) => <a key={id} href={`#${id}`} aria-current={example === id ? 'page' : undefined}><item.icon size={17}/><span>{item.title}</span><span className="nav-number">{item.number}</span></a>)}</div>)}
        </nav>
        <div className="sidebar-bottom"><span className="sidebar-eyebrow">BUILT ON YOUR FRAMEWORK</span><div className="framework-availability"><span><Check size={12}/>React</span><span><Check size={12}/>Vue</span></div><p>Solid & Svelte<br/>Not implemented yet.</p><a href={repository}>Explore the project <ArrowUpRight size={13}/></a></div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        <div className="page-breadcrumb"><span>{selected.group}</span><ChevronRight size={12}/><span>{selected.category}</span></div>
        <div className="page-intro"><div><h1>{selected.title}</h1><p>{selected.description}</p></div><span className="component-index" aria-hidden="true">{selected.number}<span> / 05</span></span></div>
        <div className="workbench">
          <div className="comparison-toolbar">
            <div className="preview-controls" role="tablist" aria-label="Example view"><button id="preview-tab" role="tab" aria-selected={!showCode} aria-controls="preview-panel" tabIndex={!showCode ? 0 : -1} onClick={() => selectView(false)} onKeyDown={event => navigateView(event, false)}><PanelsTopLeft size={15}/>Preview</button><button id="code-tab" role="tab" aria-selected={showCode} aria-controls="code-panel" tabIndex={showCode ? 0 : -1} onClick={() => selectView(true)} onKeyDown={event => navigateView(event, true)}><Code2 size={16}/>Code</button></div>
            <div className="toolbar-actions"><div className="framework-control"><label htmlFor="framework">Destyler</label><div className="select-wrap"><select id="framework" aria-label="Destyler framework" value={framework} onChange={event => setFramework(event.target.value as Framework)}><option value="react">React</option><option value="vue">Vue</option></select><ChevronDown size={13} aria-hidden="true"/></div></div><div className="theme-control" role="group" aria-label="Both color modes"><button aria-label="All light" title="All light" aria-pressed={!modes.reference && !modes[framework]} onClick={() => setModes({ reference: false, react: false, vue: false })}><Sun size={15}/></button><button aria-label="All dark" title="All dark" aria-pressed={modes.reference && modes[framework]} onClick={() => setModes({ reference: true, react: true, vue: true })}><Moon size={15}/></button></div></div>
          </div>
          <div id="preview-panel" role="tabpanel" aria-labelledby="preview-tab" hidden={showCode} tabIndex={0}>
            <div className="comparison-grid" data-example={example}>
              {panels.map(({ id, title: panelTitle, subtitle, component: Demo }, index) => <section key={id} className="demo-panel" data-demo={id} aria-label={`${panelTitle} preview`}>
                <div className="panel-heading"><div className="panel-identity">{index ? <Mark small/> : <span className="shadcn-mark" aria-hidden="true">╱╱</span>}<h2>{index ? 'Destyler' : 'shadcn/ui'}</h2><span className="panel-badge">{index ? 'ADAPTED' : 'ORIGINAL'}</span></div><button aria-label={`Toggle ${panelTitle} color mode`} aria-pressed={modes[id]} title={`Toggle ${panelTitle} color mode`} className="panel-mode" onClick={() => setModes(state => ({ ...state, [id]: !state[id] }))}>{modes[id] ? <Moon size={15}/> : <Sun size={15}/>}</button></div>
                <div data-design="shadcn" className={'demo-surface ' + (modes[id] ? 'dark' : '')}><div className={'demo-example' + (example === 'switch' || example === 'checkbox' ? ' control-example' : '')} key={example}>{(example === 'switch' || example === 'checkbox') && <div className="example-card-heading"><span className="example-card-icon"><Bell size={17}/></span><h3>{example === 'switch' ? 'Notifications' : 'Stay in the loop'}</h3><p>{example === 'switch' ? 'Choose what reaches your inbox.' : 'A few updates, on your terms.'}</p></div>}<Demo dark={modes[id]} example={example}/></div></div>
                <div className="panel-caption"><span><span className="small-status"/>{subtitle}</span><span>{index ? 'beta.21' : 'New York v4'}</span></div>
              </section>)}
            </div>
            <div className="preview-footnote"><span><span className="live-indicator"/>Live components. Try both sides.</span><span className="keyboard-hint"><kbd>{selected.shortcut}</kbd>{selected.action}</span></div>
          </div>
          <div id="code-panel" role="tabpanel" aria-labelledby="code-tab" hidden={!showCode} tabIndex={0}>{showCode && <StyleInspector framework={framework} selectedComponent={example} onClose={() => selectView(false, true)}/>}</div>
        </div>
        <div className="comparison-context"><div><span className="context-label">ONE DESIGN, TWO FOUNDATIONS</span><p>Original shadcn/ui on the left.<br className="mobile-break"/> Real Destyler primitives on the right.</p></div><a href={source}>View original source <ArrowUpRight size={14}/></a></div>
        <details className="implementation-notes"><summary><span>About this comparison</span><Plus size={16}/></summary><div className="details-grid"><div><h3>Source-backed styling</h3><p>Both sides share the pinned New York styles and Zinc tokens. Destyler adapts the state selectors, not the design.</p></div><div><h3>Real framework components</h3><p>React and Vue are implemented. Solid and Svelte are not yet implemented. Card and Button are presentational.</p></div><div><h3>A working prototype</h3><p>Nothing is saved. Switching frameworks resets the Destyler example. Code shows the actual source; compiled CSS is the full page stylesheet.</p></div></div></details>
        <p className="mobile-support">React + Vue available · Solid & Svelte not implemented</p>
        <footer className="site-footer"><span>destyler <span>/</span> designs</span><div><span>Open source. Open possibilities.</span><a href="/THIRD_PARTY_NOTICES.txt">Licenses <ArrowUpRight size={12}/></a></div></footer>
      </main>
    </div>
  </div>
}
createRoot(document.getElementById('app')!).render(<App/>)
