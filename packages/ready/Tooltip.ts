import { validateAccessibleText } from './accessible-text'

export interface TooltipProps {
  /** Visible, accessible button name, distinct from the supplementary text. */
  trigger: string
  /** Supplementary plain text; interactive content belongs in Popover. */
  text: string
}

export function tooltipText({ trigger, text }: TooltipProps) {
  return {
    trigger: validateAccessibleText(trigger, 'Tooltip', 'trigger'),
    text: validateAccessibleText(text, 'Tooltip', 'text'),
  }
}

export const tooltipPositioning = { placement: 'bottom' as const, gutter: 4 }
const openDelay = 300
const closeGrace = 250

/** Own opening/dismissal while the pinned primitive owns positioning and ARIA.
 * Its closing state remains visible but stops listening for Escape, and its
 * pointer-leave action doesn't preserve a concurrently focused trigger.
 */
export function attachTooltipPolicy(root: HTMLElement, update: (open: boolean) => void) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-scope="tooltip"][data-part="trigger"]')
  const content = root.querySelector<HTMLElement>('[data-scope="tooltip"][data-part="content"]')
  if (!trigger || !content) throw new Error('Ready Tooltip: expected mounted trigger and content.')
  const document = root.ownerDocument
  let visible = false
  let focused = false
  let hoveringTrigger = false
  let hoveringContent = false
  let dismissed = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = () => { clearTimeout(timer); timer = undefined }
  const publish = (next: boolean) => {
    if (next === visible) return
    visible = next
    if (next) document.addEventListener('keydown', escape, true)
    else document.removeEventListener('keydown', escape, true)
    update(next)
  }
  function escape(event: KeyboardEvent) {
    if (!visible || event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return
    event.preventDefault()
    event.stopPropagation()
    dismissed = focused || hoveringTrigger
    // Hidden content may not receive a pointerleave, so discard that source.
    hoveringContent = false
    cancel()
    publish(false)
  }
  function reconcile() {
    const active = focused || hoveringTrigger || hoveringContent
    if (!active) dismissed = false
    cancel()
    if (dismissed) return
    if (focused) publish(true)
    else if (active && !visible) timer = setTimeout(() => publish(true), openDelay)
    else if (!active && visible) timer = setTimeout(() => publish(false), closeGrace)
  }

  const enterTrigger = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    hoveringTrigger = true
    reconcile()
  }
  const leaveTrigger = () => { hoveringTrigger = false; reconcile() }
  const enterContent = (event: PointerEvent) => {
    if (!visible || event.pointerType === 'touch') return
    hoveringContent = true
    reconcile()
  }
  const leaveContent = () => { hoveringContent = false; reconcile() }
  const focus = () => { focused = trigger.matches(':focus-visible'); reconcile() }
  const blur = () => { focused = false; reconcile() }

  trigger.addEventListener('pointerenter', enterTrigger)
  trigger.addEventListener('pointerleave', leaveTrigger)
  trigger.addEventListener('pointercancel', leaveTrigger)
  trigger.addEventListener('focus', focus)
  trigger.addEventListener('blur', blur)
  content.addEventListener('pointerenter', enterContent)
  content.addEventListener('pointerleave', leaveContent)
  content.addEventListener('pointercancel', leaveContent)
  if (document.activeElement === trigger) focus()
  return () => {
    cancel()
    document.removeEventListener('keydown', escape, true)
    trigger.removeEventListener('pointerenter', enterTrigger)
    trigger.removeEventListener('pointerleave', leaveTrigger)
    trigger.removeEventListener('pointercancel', leaveTrigger)
    trigger.removeEventListener('focus', focus)
    trigger.removeEventListener('blur', blur)
    content.removeEventListener('pointerenter', enterContent)
    content.removeEventListener('pointerleave', leaveContent)
    content.removeEventListener('pointercancel', leaveContent)
  }
}
