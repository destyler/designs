<script lang="ts">
  import { Progress as Primitive } from '@destyler-ui/svelte/progress';
  import { resolveProgress, type ProgressProps } from '../Progress';

  let { label, value, min, max }: ProgressProps = $props();
  const labelId = $props.id();
  const resolved = $derived(resolveProgress({ label, value, min, max }));
</script>

<Primitive.Root class="rd-component" value={resolved.value} min={resolved.min} max={resolved.max}>
  <span id={labelId} class="rd-progress-label">{resolved.label}</span>
  <Primitive.Track aria-labelledby={labelId}>
    <Primitive.Range />
  </Primitive.Track>
</Primitive.Root>
