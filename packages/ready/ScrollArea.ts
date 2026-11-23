export type ScrollAreaProps = {
  /** Accessible name of the focusable scroll region. */
  label: string
  /** Maximum viewport height in CSS pixels. Defaults to 320. */
  maxHeight?: number
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export function scrollAreaOptions({ label, maxHeight = 320, orientation = 'vertical' }: ScrollAreaProps) {
  if (typeof label !== 'string' || !label.trim()) throw new Error('Ready ScrollArea: label must contain non-whitespace text.')
  if (!Number.isFinite(maxHeight) || maxHeight <= 0) throw new RangeError('Ready ScrollArea: maxHeight must be positive and finite.')
  if (orientation !== 'vertical' && orientation !== 'horizontal' && orientation !== 'both') {
    throw new Error('Ready ScrollArea: orientation must be vertical, horizontal, or both.')
  }
  return {
    label,
    orientation,
    style: {
      height: 'auto',
      maxHeight: `${maxHeight}px`,
      overflowX: orientation === 'vertical' ? 'hidden' : 'auto',
      overflowY: orientation === 'horizontal' ? 'hidden' : 'auto',
      scrollbarWidth: 'auto',
    } as const,
  }
}
