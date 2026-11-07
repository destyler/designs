<script setup lang="ts">
import { HoverCard } from '@destyler-ui/vue'
</script>

<template>
  <HoverCard.Root :openDelay="0" :closeDelay="0">
    <HoverCard.Trigger>Hover me</HoverCard.Trigger>
    <Teleport to="body">
      <HoverCard.Positioner data-testid="positioner">
        <HoverCard.Content>

          Content
        </HoverCard.Content>
      </HoverCard.Positioner>
    </Teleport>
  </HoverCard.Root>
</template>
