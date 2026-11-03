import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Copy, Download, ExternalLink, X } from 'lucide-react'
import tokens from '../styles/tokens.css?raw'
import reactAdapter from '../adapters/ReactDemo.tsx?raw'
import vueAdapter from '../adapters/VueDemo.vue?raw'
import { recipes, sourceRecipes } from '../styles/recipes'

export type Framework = 'react' | 'vue'
type View = 'tokens' | 'classes' | 'compiled' | 'adapter'
const groups = ['tabs', 'switch', 'checkbox', 'dialog', 'card', 'button', 'label'] as const
const repo = 'https://github.com/destyler/designs/blob/prototype/cloud-scoped-themes/examples/shadcn/'

export function StyleInspector({ framework, selectedComponent = 'switch', onClose }: { framework: Framework; selectedComponent?: (typeof groups)[number]; onClose?: () => void }) {
  const [view, setView] = useState<View>('tokens')
  const [component, setComponent] = useState<(typeof groups)[number]>(selectedComponent)
  const [compiled, setCompiled] = useState<{ code: string; url?: string }>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [copyStatus, setCopyStatus] = useState('')
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const tabs = [
    { id: 'tokens', label: 'Theme tokens' },
    { id: 'classes', label: 'Component classes' },
    { id: 'compiled', label: 'Compiled CSS' },
    { id: 'adapter', label: framework === 'react' ? 'React adapter' : 'Vue adapter' },
  ] as const
  useEffect(() => () => clearTimeout(copyTimer.current), [])
  useEffect(() => setComponent(selectedComponent), [selectedComponent])
  useEffect(() => { setCopyStatus('') }, [view, framework, component])
  useEffect(() => {
    if (view !== 'compiled' || compiled) return
    const abort = new AbortController()
    setError('')
    async function load() {
      const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
        .map(link => link.href).filter(href => new URL(href).origin === location.origin)
      if (links.length) {
        const texts = await Promise.all(links.map(async href => {
          const response = await fetch(href, { signal: abort.signal })
          if (!response.ok) throw new Error(`Stylesheet returned HTTP ${response.status}`)
          const text = await response.text()
          if (!response.headers.get('content-type')?.includes('text/css')) throw new Error('The server did not return CSS')
          return text
        }))
        if (!abort.signal.aborted) setCompiled({ code: texts.join('\n'), url: links.length === 1 ? links[0] : undefined })
      } else {
        // Vite's development server injects processed CSS as style elements.
        const code = [...document.querySelectorAll('style[data-vite-dev-id]')].map(style => style.textContent).join('\n')
        if (!code) throw new Error('No applied stylesheet was found')
        if (!abort.signal.aborted) setCompiled({ code })
      }
    }
    load().catch(error => { if (!abort.signal.aborted) setError(error.message) })
    return () => abort.abort()
  }, [view, compiled, attempt])

  const matching = Object.keys(recipes).filter(key => key === component || key.startsWith(component + '-')) as (keyof typeof recipes)[]
  const classSource = JSON.stringify({
    'shadcn/ui · original Tailwind classes': Object.fromEntries(matching.map(key => [key, sourceRecipes[key]])),
    'Destyler · shared React + Vue classes': Object.fromEntries(matching.map(key => [key, recipes[key]])),
  }, null, 2)
  const file = view === 'tokens' ? 'styles/tokens.css' : view === 'classes' ? 'styles/recipes.ts' : view === 'adapter' ? `adapters/${framework === 'react' ? 'ReactDemo.tsx' : 'VueDemo.vue'}` : 'Applied production stylesheet'
  const code = view === 'tokens' ? tokens : view === 'classes' ? classSource : view === 'adapter' ? (framework === 'react' ? reactAdapter : vueAdapter) : compiled?.code || ''
  const description = view === 'tokens'
    ? 'Actual shared Zinc tokens. Put data-design="shadcn" on the preview root; add class="dark" for dark mode. Portals receive the same scope and mode.'
    : view === 'classes'
      ? 'These are Tailwind class recipes, not standalone CSS. Both frameworks apply the same Destyler classes to their component parts; Tailwind compiles them. Only state selectors are adapted.'
      : view === 'adapter'
        ? `The actual ${framework === 'react' ? 'React' : 'Vue'} adapter running above. It imports @destyler-ui/${framework}, applies the shared recipes, and scopes the dialog portal.`
        : 'Actual CSS loaded by this page, including compiled utilities, tokens, animations, the global Tailwind reset, and demo layout. This is the full page stylesheet, not a standalone component package.'

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyStatus('Copied')
    } catch { setCopyStatus('Clipboard unavailable. Select the code below to copy it.') }
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopyStatus(''), 4000)
  }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    setView(tabs[next].id)
    document.getElementById(`source-tab-${tabs[next].id}`)?.focus()
  }
  return <section id="css-inspector" className="style-inspector" aria-labelledby="inspector-title">
    <div className="inspector-heading"><div><p className="eyebrow">Under the surface</p><h2 id="inspector-title">The details, in code.</h2></div><div className="inspector-actions"><span className="inspector-badge">Read-only · live source</span>{onClose && <button onClick={onClose} className="inspector-close" aria-label="Close code view"><X size={16}/></button>}</div></div>
    <div className="source-tabs" role="tablist" aria-label="Style source">
      {tabs.map((tab, index) => <button key={tab.id} id={`source-tab-${tab.id}`} role="tab" aria-selected={view === tab.id} aria-controls="source-panel" tabIndex={view === tab.id ? 0 : -1} onClick={() => setView(tab.id)} onKeyDown={event => navigate(event, index)}>{tab.label}</button>)}
    </div>
    <div id="source-panel" role="tabpanel" aria-labelledby={`source-tab-${view}`} tabIndex={0}>
      <div className="source-explanation"><p>{description}</p>{view === 'classes' && <label className="recipe-label">Component<select aria-label="Component recipe" value={component} onChange={event => setComponent(event.target.value as typeof component)}>{groups.map(group => <option key={group} value={group}>{group[0].toUpperCase() + group.slice(1)}</option>)}</select></label>}</div>
      {view === 'classes' && <p className="selector-note">Tabs: data-state="active" → data-selected. Switch / Checkbox: focus, disabled and invalid selectors map to Destyler data attributes.</p>}
      <div className="code-window"><div className="code-toolbar"><span className="code-filename">{file}</span><div className="code-actions">{view !== 'compiled' && <a href={repo + file} target="_blank" rel="noreferrer" aria-label="Open source on GitHub"><ExternalLink size={14}/></a>}{view === 'compiled' && compiled?.url && <a href={compiled.url} download="destyler-comparison.css"><Download size={14}/>Download CSS</a>}<button onClick={copy} disabled={!code} aria-label="Copy source">{copyStatus === 'Copied' ? <Check size={14}/> : <Copy size={14}/>}<span>{copyStatus === 'Copied' ? 'Copied' : 'Copy'}</span></button></div></div>
        {error ? <div className="source-error" role="alert">Could not load the applied CSS: {error}. <button onClick={() => setAttempt(value => value + 1)}>Retry</button></div> : <pre data-testid="css-source" tabIndex={0} aria-label={file}><code>{code || 'Loading the applied stylesheet…'}</code></pre>}
      </div>
      <p className="copy-status" role="status">{copyStatus}</p>
    </div>
  </section>
}
