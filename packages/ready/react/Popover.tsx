import { useId, type ReactNode } from 'react'
import { Popover as Primitive } from '@destyler-ui/react'
import { popoverPositioning, popoverText } from '../Popover'
import type { PopoverProps } from '../Popover'

export type { PopoverProps } from '../Popover'

export function Popover({ trigger, title, description, closeLabel, open, defaultOpen, onOpenChange, children }: PopoverProps & { children?: ReactNode }) {
  const text = popoverText(trigger, title, closeLabel, description)
  const id = useId()
  const ids = { title: `${id}-title`, description: `${id}-description` }
  return <div className="rd-component rd-popover">
    <Primitive.Root open={open} defaultOpen={defaultOpen} modal={false} portalled={false}
      positioning={popoverPositioning} ids={ids} onOpenChange={event => onOpenChange?.(event.open)}>
      <Primitive.Trigger className="rd-button">{text.trigger}</Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content aria-labelledby={ids.title} aria-describedby={text.description ? ids.description : undefined}>
          <Primitive.Title>{text.title}</Primitive.Title>
          {text.description && <Primitive.Description>{text.description}</Primitive.Description>}
          <div className="rd-popover-body">{children}</div>
          <Primitive.CloseTrigger className="rd-button" aria-label={text.closeLabel}>{text.closeLabel}</Primitive.CloseTrigger>
        </Primitive.Content>
      </Primitive.Positioner>
    </Primitive.Root>
  </div>
}
