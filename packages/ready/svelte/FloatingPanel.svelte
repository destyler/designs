<script lang="ts">
  import { untrack, type Snippet } from 'svelte'
  import { FloatingPanel as Primitive } from '@destyler-ui/svelte/floating-panel'
  import { connectFloatingPanelFocus, floatingPanelGeometry, floatingPanelText, type FloatingPanelProps } from '../FloatingPanel'

  let { trigger, title, moveHint, closeLabel, open, defaultOpen, onOpenChange, children }:
    FloatingPanelProps & { children?: Snippet } = $props()
  const text = $derived(floatingPanelText(trigger, title, moveHint, closeLabel))
  const id = $props.id()
  const ids = { title: `${id}-title` }
  const hintId = `${id}-movement`
  let localOpen = $state(untrack(() => defaultOpen ?? false))
  const expanded = $derived(open ?? localOpen)
  let root: HTMLDivElement
  $effect(() => connectFloatingPanelFocus(root))
  function change({ open: next }: { open: boolean }) {
    if (open === undefined) localOpen = next
    onOpenChange?.(next)
  }
</script>

<div class="rd-component rd-floating-panel" bind:this={root}>
  <Primitive.Root {...floatingPanelGeometry} {ids} open={expanded} closeOnEscape allowOverflow={false} resizable={false} onOpenChange={change}>
    <Primitive.Trigger class="rd-button" aria-haspopup="dialog" aria-expanded={expanded}>{text.trigger}</Primitive.Trigger>
    <Primitive.Positioner>
      <Primitive.Content aria-describedby={hintId}>
        <Primitive.Header>
          <Primitive.DragTrigger><Primitive.Title>{text.title}</Primitive.Title></Primitive.DragTrigger>
          <Primitive.CloseTrigger class="rd-button">{text.closeLabel}</Primitive.CloseTrigger>
        </Primitive.Header>
        <p id={hintId} class="rd-floating-panel-hint">{text.moveHint}</p>
        <Primitive.Body>{@render children?.()}</Primitive.Body>
      </Primitive.Content>
    </Primitive.Positioner>
  </Primitive.Root>
</div>
