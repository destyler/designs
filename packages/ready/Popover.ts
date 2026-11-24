import { validateAccessibleText } from './accessible-text'

export interface PopoverProps {
  trigger: string
  title: string
  description?: string
  closeLabel?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function popoverText(trigger: string, title: string, closeLabel = 'Close', description?: string) {
  return {
    trigger: validateAccessibleText(trigger, 'Popover', 'trigger'),
    title: validateAccessibleText(title, 'Popover', 'title'),
    closeLabel: validateAccessibleText(closeLabel, 'Popover', 'closeLabel'),
    description: typeof description === 'string' && description.trim() ? description : undefined,
  }
}

export const popoverPositioning = { placement: 'bottom-start', gutter: 8 } as const
