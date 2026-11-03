import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp, h, reactive } from 'vue'
import { Moon, Sun, ArrowUpRight, Check, Code2, ChevronDown, ChevronRight, PanelsTopLeft, ToggleRight, SquareCheck, PanelTop, SlidersHorizontal, CodeXml, Layers2 } from 'lucide-react'
import { ReferenceDemo } from './components/ReferenceDemo'
import { ReactDemo } from './adapters/ReactDemo'
import { StyleInspector, type Framework } from './components/StyleInspector'
import VueDemo from './adapters/VueDemo.vue'
import './styles/app.css'

const source = 'https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui'
const repository = 'https://github.com/destyler/designs/tree/prototype/cloud-scoped-themes'
const examples = {
  switch: { title: 'Switch', category: 'Form controls', description: 'Small controls. All the right details.', detail: 'Turn a setting on or off. Compare the same design, built on two different foundations.', icon: ToggleRight, shortcut: 'Space', action: 'Toggle the focused switch', group: 'Components' },
  checkbox: { title: 'Checkbox', category: 'Form controls', description: 'A little check. A clear choice.', detail: 'Choose an option, compare its states, and see how the design carries across frameworks.', icon: SquareCheck, shortcut: 'Space', action: 'Check or uncheck an option', group: 'Components' },
  tabs: { title: 'Tabs', category: 'Navigation', description: 'A place for everything.', detail: 'Move between related views with a familiar, keyboard-friendly set of tabs.', icon: PanelsTopLeft, shortcut: '← →', action: 'Move between tabs', group: 'Components' },
  dialog: { title: 'Dialog', category: 'Overlays', description: 'A moment of focus.', detail: 'Open a dialog to compare the overlay, focus handling, and the details within.', icon: PanelTop, shortcut: 'Esc', action: 'Close and return focus', group: 'Components' },
  settings: { title: 'Settings', category: 'Blocks', description: 'Better together.', detail: 'Tabs, switches, checkboxes, and a dialog, composed into one familiar settings panel.', icon: SlidersHorizontal, shortcut: 'Tab', action: 'Explore the interactive controls', group: 'Blocks' },
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
function App() {
  const [example, setExample] = useState<Example>(currentExample)
  const [framework, setFramework] = useState<Framework>('react')
  const [modes, setModes] = useState({ reference: false, react: false, vue: false })
  const [showCSS, setShowCSS] = useState(false)
  useEffect(() => {
    if (showCSS) document.getElementById('css-inspector')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }, [showCSS])
  useEffect(() => { const update = () => { if (Object.hasOwn(examples, window.location.hash.slice(1))) setExample(currentExample()) }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  const selected = examples[example]
  const title = framework === 'react' ? 'Destyler React' : 'Destyler Vue'
  const Component = framework === 'react' ? ReactDemo : VueMount
  const panels = [
    { id: 'reference' as const, title: 'shadcn/ui', subtitle: 'React · Radix primitives', label: 'REFERENCE', component: ReferenceDemo },
    { id: framework, title, subtitle: `@destyler-ui/${framework}`, label: 'DESTYLER', component: Component },
  ]
  return <div className="site-shell">
    <a href="#main-content" className="skip-link">Skip to preview</a>
    <header className="site-header"><a href="/" className="wordmark"><span className="brand-mark" aria-hidden="true">d.</span>destyler<span className="wordmark-divider">/</span><span className="wordmark-section">designs</span></a><nav aria-label="Site navigation"><a className="header-current" href="#switch">Components</a><a href={repository} className="repository-link"><CodeXml size={15}/><span>Source</span><ArrowUpRight size={12}/></a></nav></header>
    <div className="site-layout">
      <aside className="sidebar" aria-label="Component library">
        <div className="library-label">DESIGN LIBRARY</div>
        <div className="library-choice"><span className="library-icon"><Layers2 size={18}/></span><div><strong>shadcn/ui</strong><span>New York · Zinc</span></div><Check size={14}/></div>
        <nav className="component-navigation" aria-label="Examples">
          {['Components', 'Blocks'].map(group => <div className="nav-group" key={group}><p>{group}</p>{Object.entries(examples).filter(([, item]) => item.group === group).map(([id, item]) => <a key={id} href={`#${id}`} aria-current={example === id ? 'page' : undefined}><item.icon size={16}/><span>{item.title}</span>{example === id && <span className="nav-active-dot"/>}</a>)}</div>)}
        </nav>
        <div className="sidebar-note"><span className="small-status"/>One design layer.<br/>Your framework underneath.<a href={repository}>Explore the source <ArrowUpRight size={12}/></a></div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        <div className="page-breadcrumb"><span>{selected.group}</span><ChevronRight size={12}/><span>{selected.title}</span></div>
        <div className="page-intro"><div><h1>{selected.title}<span className="title-dot">.</span></h1><p className="intro-lead">{selected.description}</p><p className="intro-copy">{selected.detail}</p></div><span className="design-tag"><span/>New York</span></div>
        <div className="comparison-toolbar">
          <div className="preview-controls"><button className={!showCSS ? 'selected' : ''} onClick={() => setShowCSS(false)} aria-pressed={!showCSS}><PanelsTopLeft size={15}/>Preview</button><button id="css-toggle" className={showCSS ? 'selected' : ''} aria-expanded={showCSS} aria-controls="css-inspector" onClick={() => setShowCSS(value => !value)}><Code2 size={15}/>{showCSS ? 'Hide CSS' : 'View CSS'}</button></div>
          <div className="toolbar-actions"><div className="framework-control"><label htmlFor="framework">Framework</label><div className="select-wrap"><select id="framework" aria-label="Destyler framework" value={framework} onChange={event => setFramework(event.target.value as Framework)}><option value="react">React</option><option value="vue">Vue</option></select><ChevronDown size={13} aria-hidden="true"/></div></div><div className="theme-control" role="group" aria-label="Both color modes"><button aria-label="All light" title="All light" aria-pressed={!modes.reference && !modes[framework]} onClick={() => setModes({ reference: false, react: false, vue: false })}><Sun size={14}/></button><button aria-label="All dark" title="All dark" aria-pressed={modes.reference && modes[framework]} onClick={() => setModes({ reference: true, react: true, vue: true })}><Moon size={14}/></button></div></div>
        </div>
        <div className="preview-board">
          <div className="comparison-grid" data-example={example}>
            {panels.map(({ id, title, subtitle, label, component: Demo }, index) => <section key={id} className="demo-panel" data-demo={id} aria-label={`${title} preview`}>
              <div className="panel-heading"><div className="panel-identity"><span className={index ? 'implementation-symbol destyler-symbol' : 'implementation-symbol'} aria-hidden="true">{index ? 'd.' : <Layers2 size={15}/>}</span><div><div className="panel-title"><h2>{title}</h2><span className="panel-badge">{label}</span></div><p>{subtitle}</p></div></div><button aria-label={`Toggle ${title} color mode`} aria-pressed={modes[id]} title={`Toggle ${title} color mode`} className="panel-mode" onClick={() => setModes(state => ({ ...state, [id]: !state[id] }))}>{modes[id] ? <Moon size={14}/> : <Sun size={14}/>}</button></div>
              <div data-design="shadcn" className={'demo-surface ' + (modes[id] ? 'dark' : '')}><div className="demo-example" key={example}><Demo dark={modes[id]} example={example}/></div></div>
              <div className="panel-caption"><span className="small-status"/>{index === 0 ? 'Original components' : 'Real Destyler primitives'}<span>{index === 0 ? 'New York v4' : 'beta.21'}</span></div>
            </section>)}
          </div>
          <div className="preview-footnote"><span><span className="live-indicator"/>Live preview<span className="footnote-separator">/</span>Try both. They work independently.</span><span className="keyboard-hint"><kbd>{selected.shortcut}</kbd>{selected.action}</span></div>
        </div>
        {showCSS && <StyleInspector framework={framework} selectedComponent={example === 'settings' ? 'tabs' : example} onClose={() => { setShowCSS(false); document.getElementById('css-toggle')?.focus() }}/>}
        <section className="design-note" aria-label="About this comparison"><div><span className="note-eyebrow">THE SAME DESIGN LANGUAGE</span><h2>Different foundations. Familiar details.</h2><p>Original shadcn on the left. The same tokens and styles on real Destyler components on the right. Switch frameworks without changing the design.</p></div><a href={source} className="source-callout"><span>Built from the source</span><strong>shadcn/ui · 4aaea19 <ArrowUpRight size={14}/></strong><small>Official New York v4 + Zinc</small></a></section>
        <details className="implementation-notes"><summary>Implementation notes <ChevronDown size={14}/></summary><div className="details-grid"><div><h3>Two frameworks, one preview</h3><p>React and Vue are implemented. Solid and Svelte are not yet implemented. Switching frameworks resets the Destyler example; the reference keeps its state.</p></div><div><h3>Honest about the source</h3><p>Unmodified upstream shadcn components. Destyler uses shared class recipes with explicit state-selector adaptations. Card and Button are presentational.</p></div><div><h3>Just a demo</h3><p>No data is sent or saved. CSS inspection shows the actual source and applied stylesheet. It is a page stylesheet, not a standalone component package.</p></div></div></details>
        <div className="availability"><span className="availability-label">Available</span><span><Check size={11}/>React</span><span><Check size={11}/>Vue</span><span className="unavailable">Solid & Svelte · not implemented</span></div>
        <footer className="site-footer"><span>Crafted for comparison. Built with Destyler.</span><div><a href="/THIRD_PARTY_NOTICES.txt">Licenses</a><a href={repository}>GitHub <ArrowUpRight size={11}/></a></div></footer>
      </main>
    </div>
  </div>
}
createRoot(document.getElementById('app')!).render(<App/>)
