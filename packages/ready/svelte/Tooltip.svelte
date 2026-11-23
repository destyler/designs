<script lang="ts">
  import { onMount } from 'svelte'
  import { Tooltip as Primitive } from '@destyler-ui/svelte/tooltip'
  import { attachTooltipPolicy, tooltipPositioning, tooltipText, type TooltipProps } from '../Tooltip'

  let { trigger, text }: TooltipProps = $props()
  const copy = $derived(tooltipText({ trigger, text }))
  let root: HTMLDivElement
  let open = $state(false)
  onMount(() => attachTooltipPolicy(root, value => { open = value }))
</script>

<div bind:this={root} class="rd-component rd-tooltip">
  <Primitive.Root {open} interactive closeOnEscape={false} closeOnClick={false} closeOnPointerDown={false} closeOnScroll={false}
    lazyMount={false} unmountOnExit={false} positioning={tooltipPositioning}>
    <Primitive.Trigger type="button" class="rd-button">{copy.trigger}</Primitive.Trigger>
    <Primitive.Positioner><Primitive.Content>{copy.text}</Primitive.Content></Primitive.Positioner>
  </Primitive.Root>
</div>
