import { createMemo, createUniqueId, Show, type JSX } from 'solid-js'
import { Popover as Primitive } from '@destyler-ui/solid/popover'
import { popoverPositioning, popoverText } from '../Popover'
import type { PopoverProps } from '../Popover'

export type { PopoverProps } from '../Popover'

export function Popover(props: PopoverProps & { children?: JSX.Element }) {
  const text = createMemo(() => popoverText(props.trigger, props.title, props.closeLabel, props.description))
  const id = createUniqueId()
  const ids = { title: `${id}-title`, description: `${id}-description` }
  return <div class="rd-component rd-popover">
    <Primitive.Root open={props.open} defaultOpen={props.defaultOpen} modal={false} portalled={false}
      positioning={popoverPositioning} ids={ids} onOpenChange={event => props.onOpenChange?.(event.open)}>
      <Primitive.Trigger class="rd-button">{text().trigger}</Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content aria-labelledby={ids.title} aria-describedby={text().description ? ids.description : undefined}>
          <Primitive.Title>{text().title}</Primitive.Title>
          <Show when={text().description}>{description => <Primitive.Description>{description()}</Primitive.Description>}</Show>
          <div class="rd-popover-body">{props.children}</div>
          <Primitive.CloseTrigger class="rd-button" aria-label={text().closeLabel}>{text().closeLabel}</Primitive.CloseTrigger>
        </Primitive.Content>
      </Primitive.Positioner>
    </Primitive.Root>
  </div>
}
