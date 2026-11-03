import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp, h, reactive } from 'vue'
import { Moon, Sun, ArrowUpRight, Check, Code2, ChevronDown } from 'lucide-react'
import { ReferenceDemo } from './components/ReferenceDemo'
import { ReactDemo } from './adapters/ReactDemo'
import { StyleInspector, type Framework } from './components/StyleInspector'
import VueDemo from './adapters/VueDemo.vue'
import './styles/app.css'

const source = 'https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui'
function VueMount({ dark }: { dark: boolean }) {
  const element = useRef<HTMLDivElement>(null)
  const props = useRef(reactive({ dark }))
  useEffect(() => {
    const app = createApp({ render: () => h(VueDemo, props.current) })
    app.mount(element.current!)
    return () => app.unmount()
  }, [])
  useEffect(() => { props.current.dark = dark }, [dark])
  return <div ref={element}/>
}
function App() {
  const [framework, setFramework] = useState<Framework>('react')
  const [modes, setModes] = useState({ reference: false, react: false, vue: false })
  const [showCSS, setShowCSS] = useState(false)
  const title = framework === 'react' ? 'Destyler React' : 'Destyler Vue'
  const Component = framework === 'react' ? ReactDemo : VueMount
  const panels = [
    { id: 'reference' as const, title: 'shadcn/ui', subtitle: 'Official New York v4 · React + Radix', label: 'ORIGINAL', component: ReferenceDemo },
    { id: framework, title, subtitle: `@destyler-ui/${framework} · beta.21`, label: 'DESTYLER', component: Component },
  ]
  return <div className="site-shell">
    <header className="site-header"><a href="/" className="wordmark">destyler <span>/ designs</span></a><a href="https://github.com/destyler/designs/tree/prototype/cloud-scoped-themes" className="repository-link">View repository <ArrowUpRight size={14}/></a></header>
    <main>
      <div className="intro"><p className="eyebrow"><span className="status-dot"/>Design comparison · 001</p><h1>One design.<br className="mobile-break"/> Two implementations.</h1><p className="intro-copy">Original shadcn components, beside the same design on Destyler.<br className="desktop-break"/> Switch the framework. Try the interactions. See the CSS.</p></div>
      <div className="comparison-toolbar"><div className="framework-control"><label htmlFor="framework">Destyler framework</label><div className="select-wrap"><select id="framework" aria-label="Destyler framework" value={framework} onChange={event => setFramework(event.target.value as Framework)}><option value="react">React</option><option value="vue">Vue</option></select><ChevronDown size={14} aria-hidden="true"/></div></div><div className="toolbar-actions"><div className="theme-control" role="group" aria-label="Both color modes"><button aria-pressed={!modes.reference && !modes[framework]} onClick={() => setModes({ reference: false, react: false, vue: false })}><Sun size={14}/>All light</button><button aria-pressed={modes.reference && modes[framework]} onClick={() => setModes({ reference: true, react: true, vue: true })}><Moon size={14}/>All dark</button></div><button className="css-toggle" aria-expanded={showCSS} aria-controls="css-inspector" onClick={() => setShowCSS(value => !value)}><Code2 size={15}/>{showCSS ? 'Hide CSS' : 'View CSS'}</button></div></div>
      <div className="comparison-grid">
        {panels.map(({ id, title, subtitle, label, component: Demo }, index) => <section key={id} className="demo-panel" data-demo={id}>
          <div className="panel-heading"><div><div className="panel-title"><h2>{title}</h2><span className={index ? 'panel-badge adapted' : 'panel-badge'}>{label}</span></div><p>{subtitle}</p></div><button aria-label={`Toggle ${title} color mode`} aria-pressed={modes[id]} className="panel-mode" onClick={() => setModes(state => ({ ...state, [id]: !state[id] }))}>{modes[id] ? <Moon size={15}/> : <Sun size={15}/>}</button></div>
          <div data-design="shadcn" className={'demo-surface ' + (modes[id] ? 'dark' : '')}><Demo dark={modes[id]}/></div>
          <p className="panel-caption"><Check size={12}/>{index === 0 ? 'Unmodified upstream components' : 'Real Destyler primitives · shared style recipes'}</p>
        </section>)}
      </div>
      <p className="interaction-note">Try a switch, navigate tabs with ← →, or open a dialog. Switching frameworks resets the Destyler demo.</p>
      {showCSS && <StyleInspector framework={framework}/>}
      <div className="details-grid"><div><span className="detail-number">01</span><h3>Source, not imitation</h3><p>Official New York v4 + Zinc, pinned to <a href={source}>shadcn/ui 4aaea19 <ArrowUpRight size={11}/></a>. Original source and MIT notices are preserved.</p></div><div><span className="detail-number">02</span><h3>A shared design layer</h3><p>React and Vue use the same tokens and class recipes. Only component state selectors change. Destyler UI stays unstyled.</p></div><div><span className="detail-number">03</span><h3>A focused comparison</h3><p>Tabs, Switch, Checkbox, and Dialog. Card and Button are presentational. React and Vue are available; Solid and Svelte are not implemented.</p></div></div>
    </main>
    <footer className="site-footer"><span>Independent example · No data is saved. <a href="/THIRD_PARTY_NOTICES.txt">Licenses</a></span><a href="/examples/scoped-themes/">Earlier native HTML experiment <ArrowUpRight size={12}/></a></footer>
  </div>
}
createRoot(document.getElementById('app')!).render(<App/>)
