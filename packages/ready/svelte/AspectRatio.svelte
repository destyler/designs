<script lang="ts">
  import { AspectRatio as Primitive } from '@destyler-ui/svelte/aspect-ratio';
  import type { Snippet } from 'svelte';
  import { type AspectRatioProps, validateAspectRatio } from '../AspectRatio';

  let { ratio, children }: AspectRatioProps & { children?: Snippet } = $props();
  const validRatio = $derived(validateAspectRatio(ratio));
</script>

<Primitive.Root ratio={validRatio}>
  <Primitive.Content>{@render children?.()}</Primitive.Content>
</Primitive.Root>
