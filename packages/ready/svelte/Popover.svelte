<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Popover as Primitive } from '@destyler-ui/svelte/popover'
  import { popoverPositioning, popoverText } from '../Popover'
  import type { PopoverProps } from '../Popover'

  let { trigger, title, description, closeLabel, open, defaultOpen, onOpenChange, children }:
    PopoverProps & { children?: Snippet } = $props()
  const text = $derived(popoverText(trigger, title, closeLabel, description))
  const id = $props.id()
  const ids = { title: `${id}-title`, description: `${id}-description` }
</script>

<div class="rd-component rd-popover">
  <Primitive.Root {open} {defaultOpen} modal={false} portalled={false}
    positioning={popoverPositioning} {ids} onOpenChange={event => onOpenChange?.(event.open)}>
    <Primitive.Trigger class="rd-button">{text.trigger}</Primitive.Trigger>
    <Primitive.Positioner>
      <Primitive.Content aria-labelledby={ids.title} aria-describedby={text.description ? ids.description : undefined}>
        <Primitive.Title>{text.title}</Primitive.Title>
        {#if text.description}<Primitive.Description>{text.description}</Primitive.Description>{/if}
        <div class="rd-popover-body">{@render children?.()}</div>
        <Primitive.CloseTrigger class="rd-button" aria-label={text.closeLabel}>{text.closeLabel}</Primitive.CloseTrigger>
      </Primitive.Content>
    </Primitive.Positioner>
  </Primitive.Root>
</div>
