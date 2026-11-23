import { validateAccessibleText } from './accessible-text'

export interface MenuItem {
  /** Stable, unique action value within this menu. */
  value: string
  label: string
  disabled?: boolean
}

export interface MenuProps {
  /** Visible name of the menu trigger and menu. */
  trigger: string
  items: readonly MenuItem[]
  onSelect?: (value: string) => void
  onOpenChange?: (open: boolean) => void
}

export function prepareMenu(trigger: string, items: readonly MenuItem[], id: string) {
  validateAccessibleText(trigger, 'Menu', 'trigger')
  const values = new Set<string>()
  return items.map(item => {
    validateAccessibleText(item.label, 'Menu', 'item label')
    if (typeof item.value !== 'string' || !item.value.trim() || values.has(item.value)) {
      throw new Error('Ready Menu: item values must be nonblank and unique.')
    }
    values.add(item.value)
    // Primitive values are literal DOM IDs used by aria-activedescendant.
    // Scope them to the instance, and keep the callback's public values intact.
    const key = item.value.split('').map(character => character.charCodeAt(0).toString(16)).join('-')
    return { ...item, id: `rd-menu:${id}:item:${key}` }
  })
}

export function emitMenuSelection(items: ReturnType<typeof prepareMenu>, id: string, notify?: (value: string) => void) {
  const item = items.find(entry => entry.id === id)
  if (item && !item.disabled) notify?.(item.value)
}

export const menuPosition = { placement: 'bottom-start', gutter: 6 } as const

type MenuActions = { open: boolean; setHighlightedValue: (id: string) => void }
type ClickInput = Pick<MouseEvent, 'target' | 'currentTarget' | 'button' | 'defaultPrevented' | 'stopPropagation'>

/** Match AT/programmatic click to its actual action when there was no preceding pointerdown. */
export function matchMenuClick(event: ClickInput, api: MenuActions) {
  if (!api.open || event.defaultPrevented || !(event.target instanceof Element)) return
  const item = event.target.closest<HTMLElement>('[data-scope="menu"][data-part="item"]')
  if (!item || !(event.currentTarget instanceof Element) || !event.currentTarget.contains(item)) return
  if (item.hasAttribute('data-disabled') || event.button !== 0) {
    event.stopPropagation()
    return
  }
  if (item.id) api.setHighlightedValue(item.id)
}

/** A flat action menu is nonmodal: leave native Tab order intact. */
export function allowMenuTab(event: Pick<KeyboardEvent, 'key' | 'target' | 'stopPropagation'>) {
  if (event.key === 'Tab' && event.target instanceof Element && event.target.matches('[data-scope="menu"][data-part="content"]')) {
    event.stopPropagation()
  }
}

export function preserveMenuOutsideFocus(event: Pick<Event, 'currentTarget'> & { detail: { originalEvent: Event } }) {
  const next = event.detail.originalEvent.target
  const content = event.currentTarget
  if (!(next instanceof HTMLElement) || !(content instanceof HTMLElement)) return
  const doc = content.ownerDocument
  const trigger = doc.getElementById(content.getAttribute('aria-labelledby') ?? '')
  if (doc.activeElement !== next || !trigger) return
  // The primitive schedules trigger focus on close, even for focus-out.
  // Preserve the chosen destination without changing Escape's focus return.
  queueMicrotask(() => queueMicrotask(() => {
    if (next.isConnected && doc.activeElement === trigger) next.focus({ preventScroll: true })
  }))
}
