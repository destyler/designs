import { validateAccessibleText } from './accessible-text'

export interface ToastMessage {
  title: string
  description?: string
  tone?: 'info' | 'success'
  /** Whole milliseconds from 1000 to 30000. Defaults to 6000. */
  duration?: number
}

export interface ToastController {
  /** Returns an ID when shown, or undefined if unmounted or at capacity. */
  show(message: ToastMessage): string | undefined
  dismiss(id: string): void
}

export interface ToastProps {
  controller: ToastController
  label?: string
}

const MAX_VISIBLE = 3
const controllers = new WeakMap<ToastController, { host?: ToastHost }>()
const mountedHosts = new WeakMap<Document, HTMLElement>()

type ToastOptions = ReturnType<typeof readyToastOptions>
type ToastHost = {
  create: (options: ToastOptions) => string | undefined
  dismiss: (id: string) => void
  isVisible: (id: string) => boolean
  getCount: () => number
  pause: () => void
  resume: () => void
}

function readyToastOptions({ title, description, tone = 'info', duration = 6000 }: ToastMessage) {
  validateAccessibleText(title, 'Toast', 'title')
  if (description !== undefined) validateAccessibleText(description, 'Toast', 'description')
  if (tone !== 'info' && tone !== 'success') throw new Error('Ready Toast: tone must be info or success.')
  if (!Number.isSafeInteger(duration) || duration < 1000 || duration > 30_000) {
    throw new RangeError('Ready Toast: duration must be a whole number from 1000 to 30000 milliseconds.')
  }
  // Text metadata works across React/Vue/Solid nodes and Svelte Snippet types.
  return { type: tone, duration, meta: { title, description } }
}

export function createToastController(): ToastController {
  const binding: { host?: ToastHost } = {}
  const controller: ToastController = {
    show(message) {
      const options = readyToastOptions(message)
      const host = binding.host
      if (!host || host.getCount() >= MAX_VISIBLE) return undefined
      const id = host.create(options)
      return id && host.isVisible(id) ? id : undefined
    },
    dismiss(id) {
      if (typeof id === 'string' && id && binding.host?.isVisible(id)) binding.host.dismiss(id)
    },
  }
  controllers.set(controller, binding)
  return Object.freeze(controller)
}

export const readyToastGroup = {
  placement: 'bottom-end' as const,
  max: MAX_VISIBLE,
  gap: 12,
  removeDelay: 0,
  pauseOnPageIdle: true,
  // v0.0.5 hard-wires a document listener; [] matches every event, so use a
  // sentinel that no native KeyboardEvent.code can produce instead.
  hotkey: ['ReadyToastNoDocumentShortcut'],
}

export function bindToastHost(controller: ToastController, host: ToastHost, element: HTMLElement) {
  const binding = controllers.get(controller)
  if (!binding) throw new Error('Ready Toast: use createToastController() for the controller.')
  const doc = element.ownerDocument
  if (mountedHosts.has(doc) || binding.host) {
    throw new Error('Ready Toast: mount one host per document and bind a controller to one host.')
  }
  mountedHosts.set(doc, element)
  binding.host = host
  let previousFocus: HTMLElement | undefined
  const focusIn = (event: FocusEvent) => {
    // Avoid the primitive group's blur behavior moving focus back on ordinary Tab.
    event.stopPropagation()
    if (event.relatedTarget instanceof HTMLElement && !element.contains(event.relatedTarget)) {
      previousFocus = event.relatedTarget
    }
    host.pause()
  }
  const focusOut = (event: FocusEvent) => {
    event.stopPropagation()
    if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return
    if (doc.visibilityState !== 'hidden') host.resume()
  }
  const dismissFocus = (event: MouseEvent | KeyboardEvent) => {
    if (!(event.target instanceof Element) || event.defaultPrevented) return
    const isClose = 'key' in event ? event.key === 'Escape' && !event.isComposing
      : !!event.target.closest('[data-scope="toast"][data-part="close-trigger"]')
    if (!isClose) return
    const notice = event.target.closest('[data-scope="toast"][data-part="root"]')
    const restore = previousFocus
    if (!notice?.contains(doc.activeElement) || !restore?.isConnected) return
    queueMicrotask(() => {
      if ((notice.contains(doc.activeElement) || doc.activeElement === doc.body) && restore.isConnected) {
        restore.focus({ preventScroll: true })
      }
    })
  }
  element.addEventListener('focusin', focusIn, true)
  element.addEventListener('focusout', focusOut, true)
  element.addEventListener('click', dismissFocus, true)
  element.addEventListener('keydown', dismissFocus, true)
  return () => {
    delete binding.host
    if (mountedHosts.get(doc) === element) mountedHosts.delete(doc)
    element.removeEventListener('focusin', focusIn, true)
    element.removeEventListener('focusout', focusOut, true)
    element.removeEventListener('click', dismissFocus, true)
    element.removeEventListener('keydown', dismissFocus, true)
  }
}

export function toastMessageView(id?: string, metadata?: Record<string, unknown>) {
  const title = typeof metadata?.title === 'string' ? metadata.title : ''
  const description = typeof metadata?.description === 'string' ? metadata.description : undefined
  return {
    title, description,
    titleId: `toast:${id}:title`,
    descriptionId: description ? `toast:${id}:description` : undefined,
    closeLabel: `Dismiss ${title}`,
  }
}
