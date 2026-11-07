<script setup lang="ts">
import { ref } from 'vue'
import { Progress } from '@destyler-ui/vue'
const value = ref(65)
</script>
<template>
  <Progress.Root v-model="value" class="parity-stack">
    <Progress.Label>Label <span role="status">{{ value }}%</span></Progress.Label>
    <Progress.Track><Progress.Range /></Progress.Track>
    <button type="button" class="parity-button" @click="value = value >= 100 ? 0 : Math.min(100, value + 10)">Advance</button>
  </Progress.Root>
</template>
