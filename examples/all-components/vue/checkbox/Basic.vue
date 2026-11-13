<script setup lang="ts">
import { Checkbox } from '@destyler-ui/vue'
</script>

<template>
  <Checkbox.Root>
    <Checkbox.Control>
      <Checkbox.Indicator>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </Checkbox.Indicator>
    </Checkbox.Control>
    <Checkbox.Label>Checkbox</Checkbox.Label>
    <Checkbox.HiddenInput />
  </Checkbox.Root>
</template>
