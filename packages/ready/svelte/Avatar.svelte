<script lang="ts">
  import { Avatar as Primitive } from '@destyler-ui/svelte/avatar';
  import { resolveAvatar, type AvatarProps } from '../Avatar';

  let { alt, src, fallback }: AvatarProps = $props();
  const resolved = $derived(resolveAvatar({ alt, src, fallback }));
</script>

{#key resolved.source}
  <Primitive.Root class="rd-component rd-avatar" role={resolved.label ? 'img' : undefined} aria-label={resolved.label} aria-hidden={resolved.label ? undefined : true}>
    {#if resolved.source}<Primitive.Image src={resolved.source} alt="" aria-hidden="true" />{/if}
    <Primitive.Fallback aria-hidden="true">{resolved.text}</Primitive.Fallback>
  </Primitive.Root>
{/key}
