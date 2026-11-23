import { validateAccessibleText } from './accessible-text'

export interface FloatingPanelProps {
  trigger: string
  title: string
  moveHint?: string
  closeLabel?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function floatingPanelText(
  trigger: string, title: string, moveHint = 'Use arrow keys to move the focused panel.', closeLabel = 'Close',
) {
  return {
    trigger: validateAccessibleText(trigger, 'FloatingPanel', 'trigger'),
    title: validateAccessibleText(title, 'FloatingPanel', 'title'),
    moveHint: validateAccessibleText(moveHint, 'FloatingPanel', 'moveHint'),
    closeLabel: validateAccessibleText(closeLabel, 'FloatingPanel', 'closeLabel'),
  }
}

export const floatingPanelGeometry = { position: { x: 8, y: 8 }, size: { width: 280, height: 216 }, gridSize: 8 }

/** Observe accepted primitive visibility, not requests a controlled owner may veto. */
export function connectFloatingPanelFocus(root: HTMLElement) {
  const document = root.ownerDocument
  const win = document.defaultView
  if (!win) return () => {}
  const trigger = () => root.querySelector<HTMLButtonElement>('[data-scope="floating-panel"][data-part="trigger"]')
  const panel = () => root.querySelector<HTMLElement>('[data-scope="floating-panel"][data-part="content"]')
  const isOpen = (content: HTMLElement | null) => content?.dataset.state === 'open' && !content.hidden
  let open = isOpen(panel())
  let focusedInside = panel()?.contains(document.activeElement) ?? false

  function rememberFocus(event: FocusEvent) {
    const node = event.target
    focusedInside = node instanceof win!.Node && (panel()?.contains(node) ?? false)
  }
  function prepareOpen(event: MouseEvent) {
    const button = trigger()
    if (!open && !event.defaultPrevented && button && !button.disabled
      && event.target instanceof win!.Node && button.contains(event.target)) button.focus({ preventScroll: true })
  }
  function guardKey(event: KeyboardEvent) {
    if ((event.isComposing || event.keyCode === 229) && event.key === 'Escape'
      && event.target instanceof win!.Node && panel()?.contains(event.target)) event.stopPropagation()
  }
  function avoidStage(event: MouseEvent) {
    const target = event.target
    if (target instanceof win!.Element && target.closest('[data-scope="floating-panel"][data-part="drag-trigger"]')) {
      event.preventDefault() // Native handle otherwise maximizes/restores on double click.
    }
  }
  const observer = new win.MutationObserver(() => {
    const content = panel()
    const next = isOpen(content)
    if (next === open) return
    open = next
    const active = document.activeElement
    const button = trigger()
    if (open && button && active === button) content?.focus({ preventScroll: true })
    if (!open && (content?.contains(active) || (focusedInside && active === document.body))) {
      button?.focus({ preventScroll: true })
    }
    if (!open) focusedInside = false
  })
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state', 'hidden'] })
  root.addEventListener('click', prepareOpen, true)
  root.addEventListener('keydown', guardKey, true)
  root.addEventListener('dblclick', avoidStage, true)
  document.addEventListener('focusin', rememberFocus)
  return () => {
    observer.disconnect()
    root.removeEventListener('click', prepareOpen, true)
    root.removeEventListener('keydown', guardKey, true)
    root.removeEventListener('dblclick', avoidStage, true)
    document.removeEventListener('focusin', rememberFocus)
  }
}
