export type ShowcaseState = { component: 'switch' | 'dialog'; theme: 'light' | 'dark' }

/** Defaults also work during server rendering, before a browser URL exists. */
export function initialShowcaseState(initial?: Partial<ShowcaseState>): ShowcaseState {
  const query = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
  return {
    component: initial?.component ?? (query.get('component') === 'dialog' ? 'dialog' : 'switch'),
    theme: initial?.theme ?? (query.get('theme') === 'dark' ? 'dark' : 'light'),
  }
}

/** Only the same-origin embedding window can change the example or theme. */
export function connectShowcase(update: (state: ShowcaseState) => void) {
  if (typeof window === 'undefined') return () => {}
  const previousTheme = document.documentElement.getAttribute('data-theme')
  document.documentElement.dataset.theme = initialShowcaseState().theme
  const receive = (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return
    const value = event.data
    if (value?.type === 'destyler:connect') {
      window.parent.postMessage({ type: 'destyler:ready' }, window.location.origin)
      return
    }
    if (value?.type !== 'destyler:showcase' || !['switch', 'dialog'].includes(value.component) || !['light', 'dark'].includes(value.theme)) return
    document.documentElement.dataset.theme = value.theme
    update({ component: value.component, theme: value.theme })
  }
  window.addEventListener('message', receive)
  window.parent.postMessage({ type: 'destyler:ready' }, window.location.origin)
  return () => {
    window.removeEventListener('message', receive)
    if (previousTheme === null) document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', previousTheme)
  }
}
