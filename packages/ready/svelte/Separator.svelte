<script lang="ts">
  import { Separator as Primitive } from '@destyler-ui/svelte/separator';
  import type { SeparatorProps } from '../Separator';

  let { orientation = 'horizontal' }: SeparatorProps = $props();
</script>

<Primitive.Root class="rd-component" {orientation} />
