import catalog from './shared/catalog.json'
import shadcnCoverage from './shared/shadcn-coverage.json'

type SourceFile = { name: string; code: string }
type SourceResponse = { files: SourceFile[] }
type ReferenceCoverage = { status: 'direct' | 'composed' | 'none'; explanation: string; sourceUrls: string[] }
const coverage: Record<string, ReferenceCoverage> = shadcnCoverage as Record<string, ReferenceCoverage>
const labels: Record<string, string> = { shadcn: 'shadcn/ui', 'qr-code': 'QR Code', 'otp-input': 'OTP Input' }
export const componentTitle = (family: string) => labels[family] || family.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')

export function initializeGallery(doc: Document, win: Window) {
  const families = new Set(catalog.families)
  const cards = [...doc.querySelectorAll<HTMLElement>('.gallery-card')]
  const navigation = [...doc.querySelectorAll<HTMLAnchorElement>('[data-component]')]
  const sourceCache = new Map<string, SourceResponse>()
  let sharedCss: Promise<string> | undefined
  let selected = 'checkbox'
  let selectionInitialized = false
  let disposed = false
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>()
  const cleanup: Array<() => void> = []
  const on = (target: EventTarget, event: string, handler: EventListener) => {
    target.addEventListener(event, handler)
    cleanup.push(() => target.removeEventListener(event, handler))
  }
  const skipLink = doc.querySelector<HTMLAnchorElement>('.gallery-skip')
  if (skipLink) on(skipLink, 'click', event => {
    event.preventDefault()
    doc.querySelector<HTMLElement>('#gallery-main')!.focus()
  })
  const setStatus = (card: HTMLElement, value: string) => {
    const status = card.querySelector<HTMLElement>('.gallery-frame-status')!
    status.textContent = value
    status.hidden = !value
  }
  const frameUrl = (card: HTMLElement) => `/all-components/${card.dataset.framework}/?component=${encodeURIComponent(selected)}&theme=${card.dataset.theme}`
  const setFrame = (card: HTMLElement) => {
    const frame = card.querySelector('iframe')!
    clearTimeout(timers.get(card))
    setStatus(card, 'Loading example…')
    frame.src = frameUrl(card)
    frame.title = `${componentTitle(card.dataset.framework!)} ${componentTitle(selected)} example`
    card.querySelector<HTMLAnchorElement>('.gallery-open-frame')!.href = frameUrl(card)
    timers.set(card, setTimeout(() => setStatus(card, 'Still loading. Use Open to inspect this example separately.'), 15_000))
  }
  const loadSource = async (card: HTMLElement) => {
    const family = selected
    const framework = card.dataset.framework!
    const key = `${framework}/${family}`
    card.dataset.sourceKey = key
    const select = card.querySelector<HTMLSelectElement>('.gallery-source-select')!
    const code = card.querySelector<HTMLElement>('pre code')!
    code.textContent = 'Loading source…'
    try {
      let source = sourceCache.get(key)
      if (!source) {
        const response = await win.fetch(`/all-components/source/${key}.json`)
        if (!response.ok) throw new Error(`Source request failed (${response.status})`)
        const value: unknown = await response.json()
        if (!value || typeof value !== 'object' || !('files' in value) || !Array.isArray(value.files) || !value.files.length || !value.files.every(file => file && typeof file.name === 'string' && typeof file.code === 'string')) throw new Error('Invalid source response')
        source = { files: [...(value as SourceResponse).files] }
        // The reference exports its own shadcn/Tailwind sources. Destyler's shared
        // theme belongs only to the four implementation cards.
        if (framework !== 'shadcn') {
          sharedCss ??= win.fetch('/all-components/source/theme.css').then(response => {
            if (!response.ok) throw new Error(`Theme source request failed (${response.status})`)
            return response.text()
          }).catch(error => { sharedCss = undefined; throw error })
          source.files.push({ name: 'theme.css', code: await sharedCss })
        }
        sourceCache.set(key, source)
      }
      if (disposed || card.dataset.sourceKey !== key) return
      select.replaceChildren(...source.files.map((file, index) => {
        const option = doc.createElement('option')
        option.value = String(index); option.textContent = file.name
        return option
      }))
      code.textContent = source.files[0].code
    } catch (error) {
      if (!disposed && card.dataset.sourceKey === key) {
        select.replaceChildren()
        code.textContent = `Could not load this example’s source. ${String(error)}`
      }
    }
  }
  const selectView = (card: HTMLElement, view: string, focus = false) => {
    for (const tab of card.querySelectorAll<HTMLButtonElement>('[data-view]')) {
      const active = tab.dataset.view === view
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1
      if (active && focus) tab.focus()
      doc.getElementById(tab.getAttribute('aria-controls')!)!.hidden = !active
    }
    if (view === 'code') void loadSource(card)
  }
  const setTheme = (card: HTMLElement, theme: string) => {
    card.dataset.theme = theme
    const button = card.querySelector<HTMLButtonElement>('.gallery-theme-toggle')!
    button.textContent = theme === 'dark' ? 'Dark ◐' : 'Light ◑'
    button.setAttribute('aria-pressed', String(theme === 'dark'))
    button.setAttribute('aria-label', `Use ${theme === 'dark' ? 'light' : 'dark'} theme in ${componentTitle(card.dataset.framework!)}`)
    setFrame(card)
    for (const all of doc.querySelectorAll<HTMLButtonElement>('[data-all-theme]')) all.setAttribute('aria-pressed', String(cards.every(item => item.dataset.theme === all.dataset.allTheme)))
  }
  for (const card of cards) {
    on(card.querySelector('iframe')!, 'error', () => { clearTimeout(timers.get(card)); setStatus(card, 'Example could not load. Use Open to inspect it separately.') })
    on(card.querySelector('.gallery-theme-toggle')!, 'click', () => setTheme(card, card.dataset.theme === 'dark' ? 'light' : 'dark'))
    for (const tab of card.querySelectorAll<HTMLButtonElement>('[data-view]')) {
      on(tab, 'click', () => selectView(card, tab.dataset.view!))
      on(tab, 'keydown', event => {
        const key = (event as KeyboardEvent).key
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return
        event.preventDefault()
        selectView(card, key === 'Home' ? 'preview' : key === 'End' ? 'code' : tab.dataset.view === 'preview' ? 'code' : 'preview', true)
      })
    }
    on(card.querySelector('.gallery-source-select')!, 'change', event => {
      const source = sourceCache.get(card.dataset.sourceKey!)
      const item = source?.files[Number((event.target as HTMLSelectElement).value)]
      if (item) card.querySelector('pre code')!.textContent = item.code
    })
    on(card.querySelector('.gallery-copy')!, 'click', async () => {
      const status = card.querySelector<HTMLElement>('.gallery-copy-status')!
      try {
        const source = sourceCache.get(card.dataset.sourceKey!)
        const item = source?.files[Number(card.querySelector<HTMLSelectElement>('.gallery-source-select')!.value)]
        if (!item) throw new Error('Source is not loaded')
        await win.navigator.clipboard.writeText(item.code)
        status.textContent = 'Copied source.'
      } catch { status.textContent = 'Copy was unavailable. Select the source text to copy it.' }
    })
  }
  on(win, 'message', event => {
    const message = event as MessageEvent
    if (!message.source || message.origin !== win.location.origin || message.data?.type !== 'destyler:all-components-ready') return
    for (const card of cards) {
      if (message.source !== card.querySelector('iframe')!.contentWindow || message.data.family !== selected || message.data.framework !== card.dataset.framework || message.data.theme !== card.dataset.theme) continue
      clearTimeout(timers.get(card)); setStatus(card, '')
    }
  })
  const updateSelection = () => {
    let hash = ''
    try { hash = decodeURIComponent(win.location.hash.slice(1)) } catch { /* Invalid fragments use the default. */ }
    const next = families.has(hash) ? hash : 'checkbox'
    if (selectionInitialized && selected === next) return
    selected = next
    selectionInitialized = true
    const reference = coverage[selected]
    const coveragePanel = doc.querySelector<HTMLElement>('.gallery-reference-coverage')!
    coveragePanel.dataset.coverage = reference.status
    doc.querySelector('#shadcn-coverage-status')!.textContent = reference.status
    doc.querySelector('#shadcn-coverage-explanation')!.textContent = reference.explanation
    const sourceLink = doc.querySelector<HTMLAnchorElement>('#shadcn-coverage-source')!
    sourceLink.href = reference.sourceUrls[0]
    sourceLink.textContent = reference.status === 'none' ? 'Inspect pinned registry ↗' : 'View pinned source ↗'
    doc.querySelector('#component-title')!.textContent = componentTitle(selected)
    doc.title = `${componentTitle(selected)} · Destyler component gallery`
    doc.querySelector('#selected-index')!.textContent = `${String(catalog.families.indexOf(selected) + 1).padStart(2, '0')} / ${catalog.families.length}`
    for (const link of navigation) {
      if (link.dataset.component === selected) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    }
    for (const card of cards) {
      card.querySelector('.gallery-copy-status')!.textContent = ''
      setFrame(card)
      if (card.querySelector('[data-view="code"]')!.getAttribute('aria-selected') === 'true') void loadSource(card)
    }
  }
  on(win, 'hashchange', updateSelection)
  const search = doc.querySelector<HTMLInputElement>('#component-search')!
  on(search, 'input', () => {
    const query = search.value.trim().toLowerCase()
    for (const link of navigation) link.hidden = !`${link.dataset.component} ${link.textContent}`.toLowerCase().includes(query)
    doc.querySelector<HTMLElement>('#component-empty')!.hidden = navigation.some(link => !link.hidden)
  })
  for (const all of doc.querySelectorAll<HTMLButtonElement>('[data-all-theme]')) on(all, 'click', () => cards.forEach(card => setTheme(card, all.dataset.allTheme!)))
  updateSelection()
  return () => { disposed = true; cleanup.forEach(fn => fn()); timers.forEach(clearTimeout) }
}
