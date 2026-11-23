import { validateAccessibleText } from './accessible-text'

export interface NavigationMenuLink {
  id: string
  label: string
  href: string
  current?: boolean
}

export interface NavigationMenuGroup {
  id: string
  label: string
  links: readonly NavigationMenuLink[]
  disabled?: boolean
}

export type NavigationMenuItem = NavigationMenuLink | NavigationMenuGroup

/** One-level disclosure groups and native links; selection uses click or keyboard, not hover. */
export interface NavigationMenuProps {
  label: string
  items: readonly NavigationMenuItem[]
  /** Active group ID, or null when the disclosure closes. */
  onValueChange?: (value: string | null) => void
}

export function prepareNavigationMenu(label: string, items: readonly NavigationMenuItem[]) {
  validateAccessibleText(label, 'NavigationMenu', 'label')
  function validateEntry(entry: NavigationMenuItem, ids: Set<string>) {
    validateAccessibleText(entry.label, 'NavigationMenu', 'item label')
    if (typeof entry.id !== 'string' || !entry.id || /\s/.test(entry.id) || ids.has(entry.id)) {
      throw new Error('Ready NavigationMenu: item IDs must be unique, nonempty and contain no whitespace.')
    }
    ids.add(entry.id)
  }
  function validateLink(link: NavigationMenuLink) {
    if (typeof link.href !== 'string' || !link.href.trim()) throw new Error('Ready NavigationMenu: link href must be nonempty.')
    // Ignore control/space characters when detecting a scheme; leave ordinary
    // relative URLs, queries, fragments and permitted links completely intact.
    const scheme = link.href.replace(/[\u0000-\u0020]/g, '').match(/^([a-z][a-z\d+.-]*):/i)?.[1].toLowerCase()
    if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme)) {
      throw new Error('Ready NavigationMenu: unsupported link href scheme.')
    }
  }
  const topIds = new Set<string>()
  for (const item of items) {
    validateEntry(item, topIds)
    if ('href' in item) validateLink(item)
    else {
      if (!item.links.length) throw new Error('Ready NavigationMenu: groups must contain at least one link.')
      const linkIds = new Set<string>()
      for (const link of item.links) {
        validateEntry(link, linkIds)
        validateLink(link)
      }
    }
  }
  return items
}

type Disclosure = { value: string | null; setValue: (value: string | null) => void }
type KeyInput = Pick<KeyboardEvent, 'key' | 'defaultPrevented' | 'currentTarget' | 'target' | 'preventDefault' | 'stopPropagation'>
type FocusInput = Pick<FocusEvent, 'currentTarget' | 'relatedTarget'>
type LinkInput = Pick<MouseEvent, 'button' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'defaultPrevented' | 'currentTarget'>

/** Escape closes a disclosure and takes focus out of the panel before it is hidden. */
export function navigationEscape(event: KeyInput, api: Disclosure) {
  if (event.key !== 'Escape' || event.defaultPrevented || api.value == null) return
  event.preventDefault()
  event.stopPropagation()
  restoreNavigationFocus(event.target, api.value)
  api.setValue(null)
}

/** Let arrow/Home/End on real links retain browser behavior, not trigger roving. */
export function navigationLinkKeys(event: KeyInput) {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation()
}

/** Tab can leave the nav naturally; closing never steals outside focus. */
export function navigationFocusOut(event: FocusInput, api: Disclosure) {
  if (!api.value || !(event.currentTarget instanceof HTMLElement)) return
  const list = event.currentTarget
  if (event.relatedTarget instanceof Node) {
    if (!list.contains(event.relatedTarget)) api.setValue(null)
    return
  }
  // A null relatedTarget can be a browser focus transition. Recheck after it settles.
  queueMicrotask(() => {
    if (list.isConnected && !list.contains(list.ownerDocument.activeElement)) api.setValue(null)
  })
}

export function navigationLinkClick(event: LinkInput, api: Disclosure) {
  if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || api.value == null) return
  restoreNavigationFocus(event.currentTarget, api.value)
  api.setValue(null)
  // Do not prevent the browser's Space/Enter/click/modified-link behavior.
}

function restoreNavigationFocus(origin: EventTarget | null, value: string) {
  if (!(origin instanceof Element)) return
  const panel = origin.closest('[data-scope="navigation-menu"][data-part="content"]')
  if (!panel || !panel.contains(panel.ownerDocument.activeElement)) return
  const list = panel.closest('[data-scope="navigation-menu"][data-part="list"]')
  const trigger = Array.from(list?.querySelectorAll<HTMLButtonElement>('[data-scope="navigation-menu"][data-part="trigger"]') ?? [])
    .find(candidate => candidate.dataset.value === value && !candidate.disabled)
  trigger?.focus({ preventScroll: true })
}

/** Enter a horizontal disclosure with Down/Up without toggling an open panel. */
export function navigationTriggerDirection(event: KeyInput, api: Disclosure) {
  if (event.defaultPrevented || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return
  const trigger = event.target
  if (!(trigger instanceof HTMLButtonElement) || trigger.disabled
    || !trigger.matches('[data-scope="navigation-menu"][data-part="trigger"]')) return
  const id = trigger.dataset.value
  if (!id) return
  event.preventDefault()
  event.stopPropagation()
  if (api.value !== id) api.setValue(id)
  trigger.ownerDocument.defaultView?.requestAnimationFrame(() => {
    if (trigger.getAttribute('aria-expanded') !== 'true' || !trigger.matches(':focus')) return
    const panelId = trigger.getAttribute('aria-controls')
    const links = panelId && (trigger.getRootNode() as Document | ShadowRoot).getElementById(panelId)?.querySelectorAll<HTMLAnchorElement>('a[href]')
    if (!links || !links.length) return
    links[event.key === 'ArrowDown' ? 0 : links.length - 1]?.focus({ preventScroll: true })
  })
}
