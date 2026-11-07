<script setup lang="ts">
import { ToggleGroup } from '@destyler-ui/vue'
</script>

<template>
  <ToggleGroup.Root aria-label="Select a letter">
    <ToggleGroup.Item value="a" aria-label="A">A</ToggleGroup.Item>
    <ToggleGroup.Item value="b" aria-label="B">B</ToggleGroup.Item>
    <ToggleGroup.Item value="c" aria-label="C">C</ToggleGroup.Item>
  </ToggleGroup.Root>
</template>
