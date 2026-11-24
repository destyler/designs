<script lang="ts">
  import type { Snippet } from 'svelte'
  import { ScrollArea as Primitive } from '@destyler-ui/svelte/scroll-area'
  import { scrollAreaOptions, type ScrollAreaProps } from '../ScrollArea'

  const props: ScrollAreaProps & { children?: Snippet } = $props()
  const options = $derived(scrollAreaOptions(props))
  let style = $derived(`height:auto;max-height:${options.style.maxHeight};overflow-x:${options.style.overflowX};overflow-y:${options.style.overflowY};scrollbar-width:auto`)
</script>

<Primitive.Root class="rd-component rd-scroll-area">
  <Primitive.Viewport role="region" aria-label={options.label} {style} data-rd-orientation={options.orientation}>
    <Primitive.Content>{@render props.children?.()}</Primitive.Content>
  </Primitive.Viewport>
</Primitive.Root>
