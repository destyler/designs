import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Copy, Download, ExternalLink, X } from 'lucide-react'
import tokens from '../styles/tokens.css?raw'
import reactAdapter from '../adapters/ReactDemo.tsx?raw'
import vueAdapter from '../adapters/VueDemo.vue?raw'
import { recipes, sourceRecipes } from '../styles/recipes'
import { extractAdapterSource, tokenizeSource } from './source-view'

export type Framework = 'react' | 'vue'
type View = 'tokens' | 'classes' | 'compiled' | 'adapter'
const groups = ['tabs', 'switch', 'checkbox', 'dialog', 'card', 'button', 'label'] as const
const repo = 'https://github.com/destyler/designs/blob/prototype/cloud-scoped-themes/examples/shadcn/'

export function StyleInspector({ framework, selectedComponent = 'switch', onClose }: { framework: Framework; selectedComponent?: (typeof groups)[number] | 'settings'; onClose?: () => void }) {
  const [view, setView] = useState<View>('adapter')
  const [component, setComponent] = useState<(typeof groups)[number] | 'settings'>(selectedComponent)
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

  const matching = Object.keys(recipes).filter(key => component === 'settings' || key === component || key.startsWith(component + '-')) as (keyof typeof recipes)[]
  const classSource = JSON.stringify({
    'shadcn/ui · original Tailwind classes': Object.fromEntries(matching.map(key => [key, sourceRecipes[key]])),
    'Destyler · shared React + Vue classes': Object.fromEntries(matching.map(key => [key, recipes[key]])),
  }, null, 2)
  const file = view === 'tokens' ? 'styles/tokens.css' : view === 'classes' ? 'styles/recipes.ts' : view === 'adapter' ? `adapters/${framework === 'react' ? 'ReactDemo.tsx' : 'VueDemo.vue'}` : 'Applied production stylesheet'
  const adapterSource = framework === 'react' ? reactAdapter : vueAdapter
  const excerpts = useMemo(() => extractAdapterSource(adapterSource, framework, selectedComponent), [adapterSource, framework, selectedComponent])
  const isFullAdapter = excerpts.length === 1 && excerpts[0].code === adapterSource
  const code = view === 'tokens' ? tokens : view === 'classes' ? classSource : view === 'adapter' ? excerpts.map(excerpt => excerpt.code).join('\n\n') : compiled?.code || ''
  const description = view === 'tokens'
    ? 'Actual shared Zinc tokens. Put data-design="shadcn" on the preview root; add class="dark" for dark mode. Portals receive the same scope and mode.'
    : view === 'classes'
      ? 'These are Tailwind class recipes, not standalone CSS. Both frameworks apply the same Destyler classes to their component parts; Tailwind compiles them. Only state selectors are adapted.'
      : view === 'adapter'
        ? isFullAdapter
          ? `Full ${framework === 'react' ? 'React' : 'Vue'} adapter used by this preview. Shared recipes supply the styles.`
          : `Actual ${selectedComponent} source excerpts from the ${framework === 'react' ? 'React' : 'Vue'} adapter. Shared imports and setup are included. Omitted sections are available in the full file on GitHub.`
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
  return <section id="css-inspector" className="style-inspector" aria-label="Component source">
    <div className="source-tabs" role="tablist" aria-label="Style source">
      {tabs.map((tab, index) => <button key={tab.id} id={`source-tab-${tab.id}`} role="tab" aria-selected={view === tab.id} aria-controls="source-panel" tabIndex={view === tab.id ? 0 : -1} onClick={() => setView(tab.id)} onKeyDown={event => navigate(event, index)}>{tab.label}</button>)}
    </div>
    <div id="source-panel" role="tabpanel" aria-labelledby={`source-tab-${view}`} tabIndex={0}>
      <div className="source-explanation"><p>{description}</p>{view === 'classes' && <label className="recipe-label">Component<select aria-label="Component recipe" value={component} onChange={event => setComponent(event.target.value as typeof component)}>{(['settings', ...groups] as const).map(group => <option key={group} value={group}>{group === 'settings' ? 'All components' : group[0].toUpperCase() + group.slice(1)}</option>)}</select></label>}</div>
      {view === 'classes' && <p className="selector-note">Tabs: data-state="active" → data-selected. Switch / Checkbox: focus, disabled and invalid selectors map to Destyler data attributes.</p>}
      <div className="code-window"><div className="code-toolbar"><span className="code-filename">{file}</span><div className="code-actions">{view === 'adapter' && <span className="source-range">{isFullAdapter ? 'Full file' : 'Excerpt'} · {excerpts.map(excerpt => `L${excerpt.startLine}–${excerpt.endLine}`).join(', ')}</span>}{view !== 'compiled' && <a href={repo + file} target="_blank" rel="noreferrer" aria-label="Open full source on GitHub" title="Full file on GitHub"><ExternalLink size={14}/></a>}{view === 'compiled' && compiled?.url && <a href={compiled.url} download="destyler-comparison.css"><Download size={14}/>Download CSS</a>}<button onClick={copy} disabled={!code} aria-label="Copy source">{copyStatus === 'Copied' ? <Check size={14}/> : <Copy size={14}/>}<span>{copyStatus === 'Copied' ? 'Copied' : 'Copy'}</span></button>{onClose && <button onClick={onClose} className="inspector-close" aria-label="Return to preview" title="Return to preview"><X size={14}/></button>}</div></div>
        {view === 'compiled' && error ? <div className="source-error" role="alert">Could not load the applied CSS: {error}. <button onClick={() => setAttempt(value => value + 1)}>Retry</button></div> : <pre data-testid="css-source" tabIndex={0} aria-label={file}><code><HighlightedSource code={code || 'Loading the applied stylesheet…'}/></code></pre>}
      </div>
      <p className="copy-status" role="status">{copyStatus}</p>
    </div>
  </section>
}

function HighlightedSource({ code }: { code: string }) {
  const tokens = useMemo(() => tokenizeSource(code), [code])
  return <>{tokens.map((token, index) => token.kind
    ? <span key={index} className={`syntax-${token.kind}`}>{token.text}</span>
    : token.text)}</>
}
