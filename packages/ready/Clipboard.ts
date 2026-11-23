import { validateAccessibleText } from './accessible-text'

export interface ClipboardProps {
  label: string
  /** Exact single-line text. An empty string cannot be copied with the button. */
  value: string
  copyLabel?: string
  pendingMessage?: string
  copiedMessage?: string
  errorMessage?: string
}

export type ClipboardPhase = 'idle' | 'pending' | 'copied' | 'error'

export function clipboardText({ label, value, copyLabel = 'Copy', pendingMessage = 'Copying…', copiedMessage = 'Copied to clipboard', errorMessage = 'Could not copy. Select the text and copy it manually.' }: ClipboardProps) {
  if (typeof value !== 'string' || /[\r\n]/.test(value))
    throw new TypeError('Ready Clipboard: value must be single-line text.')
  const descriptions = { label, copyLabel, pendingMessage, copiedMessage, errorMessage }
  for (const [name, text] of Object.entries(descriptions)) validateAccessibleText(text, 'Clipboard', name)
  return { ...descriptions, value }
}

export function clipboardStatus(phase: ClipboardPhase, copy: ReturnType<typeof clipboardText>) {
  return phase === 'pending' ? copy.pendingMessage : phase === 'copied' ? copy.copiedMessage : phase === 'error' ? copy.errorMessage : ''
}

/** Use the native promise, not the pinned primitive's optimistic COPY event. */
export function attachClipboard(root: HTMLElement, update: (phase: ClipboardPhase) => void) {
  const input = root.querySelector<HTMLInputElement>('[data-rd-copy-value]')
  const button = root.querySelector<HTMLButtonElement>('[data-rd-copy-button]')
  if (!input || !button) throw new Error('Ready Clipboard: missing input or copy button.')
  let generation = 0
  let pending = false
  let disposed = false
  async function copy() {
    if (pending || disposed || input!.value === '') return
    const text = input!.value
    const attempt = ++generation
    pending = true
    update('pending')
    let result: ClipboardPhase = 'error'
    try {
      const clipboard = button!.ownerDocument.defaultView?.navigator.clipboard
      if (typeof clipboard?.writeText !== 'function') throw new Error('Clipboard API unavailable.')
      await clipboard.writeText(text)
      result = 'copied'
    } catch {
      // Keep the read-only field selectable; there is no silent fallback copy.
    } finally {
      pending = false
      if (!disposed && button!.isConnected)
        update(attempt === generation && input!.value === text ? result : 'idle')
    }
  }
  button.addEventListener('click', copy)
  return {
    invalidate() {
      generation++
      if (!pending) update('idle')
    },
    dispose() {
      disposed = true
      button.removeEventListener('click', copy)
    },
  }
}
