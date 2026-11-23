import { validateAccessibleText } from './accessible-text'

export interface CarouselItem {
  /** Stable unique key across renders. */
  id: string
  /** Accessible name of this slide. */
  label: string
  /** Plain-text rendering when no framework-specific slide renderer is supplied. */
  content?: string
}

export interface CarouselProps {
  label: string
  items: readonly CarouselItem[]
  /** Called with the zero-based page after successful navigation. */
  onPageChange?: (page: number) => void
}

export function validateCarousel(label: string, items: readonly CarouselItem[]) {
  validateAccessibleText(label, 'Carousel', 'label')
  const ids = new Set<string>()
  for (const item of items) {
    validateAccessibleText(item.id, 'Carousel', 'item.id')
    validateAccessibleText(item.label, 'Carousel', 'item.label')
    if (ids.has(item.id)) throw new Error('Ready Carousel: item IDs must be unique.')
    ids.add(item.id)
  }
  return items
}

export function carouselPage(page: number, length: number) {
  return Math.max(0, Math.min(page, length - 1))
}

export function notifyCarouselPage(page: number, length: number, rootId: string, notify?: (page: number) => void) {
  if (!Number.isInteger(page) || page < 0 || page >= length) return
  // A swipe/scroll can change the slide while a link in the outgoing one owns
  // focus. Move that focus before rendering it inert; don't move control focus.
  if (typeof document !== 'undefined') {
    let current = document.activeElement
    while (current?.shadowRoot?.activeElement) current = current.shadowRoot.activeElement
    let outgoing: Element | undefined
    for (; current; current = current.parentElement) {
      if (current.id === rootId) {
        if (outgoing?.getAttribute('data-index') != null && Number(outgoing.getAttribute('data-index')) !== page) {
          current.querySelector<HTMLElement>(`:scope > [data-part="control"] > [data-part="indicator-group"] > [data-index="${page}"]`)
            ?.focus({ preventScroll: true })
        }
        break
      }
      if (current.matches('[data-scope="carousel"][data-part="item"]')) outgoing = current
    }
  }
  notify?.(page)
}

/** Keep the visible ordinal even when custom labels are repeated. */
export function slideLabel(item: CarouselItem, index: number, count: number) {
  return `${item.label} (${index + 1} of ${count})`
}
