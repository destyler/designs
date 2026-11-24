<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Collapsible as Primitive } from '@destyler-ui/svelte/collapsible';
  import type { CollapsibleProps } from '../Collapsible';
  import { validateAccessibleText } from '../accessible-text';

  let { trigger, open, defaultOpen, disabled, onOpenChange, children }: CollapsibleProps & { children?: Snippet } = $props();
  const text = $derived(validateAccessibleText(trigger, 'Collapsible', 'trigger'));
</script>

<Primitive.Root class="rd-component" {open} {defaultOpen} {disabled} onOpenChange={({ open: next }) => onOpenChange?.(next)}>
  <Primitive.Trigger class="rd-button" {disabled}>{text}</Primitive.Trigger>
  <Primitive.Content>{@render children?.()}</Primitive.Content>
</Primitive.Root>
