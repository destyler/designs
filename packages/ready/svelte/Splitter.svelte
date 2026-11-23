<script lang="ts">
  import { Splitter as Primitive } from '@destyler-ui/svelte/splitter';
  import type { Snippet } from 'svelte';
  import { preventSplitterHover, resolveSplitter, splitterFirstSize, splitterPanels, type SplitterProps } from '../Splitter';

  let { first, second, onSizeChange, ...props }: SplitterProps & {
    first?: Snippet;
    second?: Snippet;
    } = $props();
  const layout = $derived(resolveSplitter(props));
</script>

<div class="rd-splitter" onpointerovercapture={preventSplitterHover} data-orientation={layout.orientation}>
  <Primitive.Root defaultSize={layout.defaultSize} orientation={layout.orientation} onSizeChange={({ size }) => {
    const firstSize = splitterFirstSize(size);
    if (firstSize !== undefined) onSizeChange?.(firstSize);
  }}>
    <Primitive.Panel id={splitterPanels.first}>{@render first?.()}</Primitive.Panel>
    <Primitive.ResizeTrigger id={splitterPanels.handle} step={layout.step} disabled={layout.disabled}
      type="button" tabindex={layout.disabled ? -1 : 0} aria-disabled={layout.disabled || undefined} aria-label={layout.label} />
    <Primitive.Panel id={splitterPanels.second}>{@render second?.()}</Primitive.Panel>
  </Primitive.Root>
</div>
