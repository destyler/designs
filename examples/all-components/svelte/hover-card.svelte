<script lang="ts">
  import type { HoverCardRootProps } from '@destyler-ui/svelte/hover-card'
  import { portal } from '@destyler-ui/svelte'
  import { HoverCard } from '@destyler-ui/svelte/hover-card'
  const props: HoverCardRootProps = $props()
</script>
<HoverCard.Root openDelay={0} closeDelay={0} {...props}>
  <HoverCard.Trigger>Hover me</HoverCard.Trigger>
  <div use:portal><HoverCard.Positioner data-testid="positioner"><HoverCard.Content>Content</HoverCard.Content></HoverCard.Positioner></div>
</HoverCard.Root>
