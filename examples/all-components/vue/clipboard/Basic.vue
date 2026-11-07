<script setup lang="ts">
import { ref } from 'vue'
import { Clipboard } from '@destyler-ui/vue'
const value = 'https://destyler.org'
const status = ref('Not copied')
async function copy() {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(value)
    status.value = 'Copied'
  } catch { status.value = 'Copy unavailable. Select the link and copy it manually.' }
}
</script>
<template>
  <Clipboard.Root :value="value" class="parity-stack">
    <Clipboard.Label>Copy this link</Clipboard.Label>
    <Clipboard.Input readonly />
    <button type="button" class="parity-button" @click="copy">Copy link</button>
    <p role="status" class="parity-status">{{ status }}</p>
  </Clipboard.Root>
</template>
