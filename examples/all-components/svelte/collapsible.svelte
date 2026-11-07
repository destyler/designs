<script lang="ts">
  import type { CollapsibleRootProps } from '@destyler-ui/svelte/collapsible'
  import { Collapsible } from '@destyler-ui/svelte/collapsible'
  const props: CollapsibleRootProps = $props()
</script>
<Collapsible.Root {...props}>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>Content</Collapsible.Content>
</Collapsible.Root>
