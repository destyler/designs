import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp, h, reactive } from 'vue'
import { Moon, Sun, ArrowUpRight, Check } from 'lucide-react'
import { ReferenceDemo } from './components/ReferenceDemo'
import { ReactDemo } from './adapters/ReactDemo'
import VueDemo from './adapters/VueDemo.vue'
import './styles/app.css'

const source = 'https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui'
function VueMount({ dark }: { dark: boolean }) {
  const element = useRef<HTMLDivElement>(null)
  const props = useRef(reactive({ dark }))
  useEffect(()=> { const app = createApp({ render: ()=>h(VueDemo, props.current) }); app.mount(element.current!); return ()=>app.unmount() },[])
  useEffect(()=>{props.current.dark=dark},[dark])
  return <div ref={element}/>
}
const panels = [
  { id:'reference', title:'shadcn/ui', subtitle:'Original source · React + Radix', label:'REFERENCE', component:ReferenceDemo },
  { id:'react', title:'Destyler React', subtitle:'@destyler-ui/react · beta.21', label:'ADAPTED', component:ReactDemo },
  { id:'vue', title:'Destyler Vue', subtitle:'@destyler-ui/vue · beta.21', label:'ADAPTED', component:VueMount },
] as const
function App() {
  const [modes, setModes] = useState({reference:false, react:false, vue:false})
  return <div className="mx-auto max-w-[1480px] px-5 md:px-10">
    <header className="flex items-center justify-between border-b border-zinc-200 py-6"><a href="/" className="text-sm font-semibold tracking-tight">destyler <span className="ml-2 font-normal text-zinc-500">/ designs</span></a><a href="https://github.com/destyler/designs/tree/prototype/cloud-scoped-themes" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-950">View repository <ArrowUpRight className="size-3.5"/></a></header>
    <main className="py-12 md:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6"><div><p className="mb-3 text-xs font-medium uppercase tracking-[.16em] text-zinc-500">Design transfer · 001</p><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">One design. Real components.</h1><p className="mt-4 max-w-[670px] text-sm leading-6 text-zinc-500">The actual shadcn/ui New York source on the left. The same styles on Destyler React and Vue on the right. Change a setting, use the keyboard, or open a dialog.</p></div><div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1"><button className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-zinc-100" onClick={()=>setModes({reference:false,react:false,vue:false})}><Sun className="size-3.5"/>All light</button><button className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-zinc-100" onClick={()=>setModes({reference:true,react:true,vue:true})}><Moon className="size-3.5"/>All dark</button></div></div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {panels.map(({id,title,subtitle,label,component:Component},i)=><section key={id} className="demo-panel" data-demo={id}>
          <div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{title}</h2><span className="rounded border border-zinc-200 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-zinc-500">{label}</span></div><p className="mt-1 text-[11px] text-zinc-500">{subtitle}</p></div><button aria-label={`Toggle ${title} color mode`} aria-pressed={modes[id]} className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-zinc-950" onClick={()=>setModes(s=>({...s,[id]:!s[id]}))}>{modes[id] ? <Moon className="size-3.5"/> : <Sun className="size-3.5"/>}</button></div>
          <div data-design="shadcn" className={'demo-surface '+(modes[id]?'dark':'')}><Component dark={modes[id]}/></div>
          <p className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500"><Check className="size-3"/>{i===0?'Unmodified upstream component source':'Real Destyler primitives, shared style recipes'}</p>
        </section>)}
      </div>
      <div className="mt-12 grid gap-8 border-t border-zinc-200 pt-8 text-xs leading-6 text-zinc-500 md:grid-cols-3"><div><h3 className="mb-2 font-medium text-zinc-800">Source, not imitation</h3><p>New York v4 + Zinc, pinned to <a className="source-link" href={source}>shadcn/ui 4aaea19</a>. Styles are extracted from source. MIT notices are retained.</p></div><div><h3 className="mb-2 font-medium text-zinc-800">A separate design layer</h3><p>Only recipes and state-selector mappings live here. Destyler UI stays unstyled. Both frameworks consume the same classes and theme tokens.</p></div><div><h3 className="mb-2 font-medium text-zinc-800">An honest first slice</h3><p>Tabs, Switch, Checkbox, and Dialog. React and Vue only. Presentational Card and Button use upstream markup. Not a complete shadcn port.</p></div></div>
    </main>
    <footer className="flex flex-wrap justify-between gap-4 border-t border-zinc-200 py-6 text-[11px] text-zinc-400"><span>Independent example · No accounts, no backend, no saved data. <a className="source-link" href="/THIRD_PARTY_NOTICES.txt">Licenses</a></span><a href="/examples/scoped-themes/" className="hover:text-zinc-800">Earlier native HTML experiment ↗</a></footer>
  </div>
}
createRoot(document.getElementById('app')!).render(<App/>)
