export type ShowcaseState = { component: 'switch' | 'dialog'; theme: 'light' | 'dark' }
export function initialShowcaseState(): ShowcaseState {
  const query = new URLSearchParams(location.search)
  return { component: query.get('component') === 'dialog' ? 'dialog' : 'switch', theme: query.get('theme') === 'dark' ? 'dark' : 'light' }
}
/** Only the same-origin embedding window can change the example or theme. */
export function connectShowcase(update: (state: ShowcaseState) => void) {
  const receive = (event: MessageEvent) => {
    if (event.origin !== location.origin || event.source !== parent) return
    const value = event.data
    if (value?.type !== 'destyler:showcase' || !['switch', 'dialog'].includes(value.component) || !['light', 'dark'].includes(value.theme)) return
    update({ component: value.component, theme: value.theme })
  }
  window.addEventListener('message', receive)
  parent.postMessage({ type: 'destyler:ready' }, location.origin)
  return () => window.removeEventListener('message', receive)
}
export const notifications = [
  { key: 'updates', label: 'Product updates', description: 'New features, delivered to your inbox.', checked: true, disabled: false },
  { key: 'marketing', label: 'Marketing emails', description: 'Occasional news and inspiration.', checked: false, disabled: false },
  { key: 'security', label: 'Security alerts', description: 'Always on to keep your account safe.', checked: true, disabled: true },
] as const
