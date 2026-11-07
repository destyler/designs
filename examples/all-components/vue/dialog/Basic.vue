<script setup lang="ts">
import { ref } from 'vue'
import { Dialog } from '@destyler-ui/vue'
const open = ref(false)
</script>

<template>
  <Dialog.Root v-model:open="open">
    <Dialog.Trigger class="parity-button">Open Dialog</Dialog.Trigger>
    <Teleport to="body">
      <Dialog.Backdrop />
      <Dialog.Positioner data-testid="positioner">
        <Dialog.Content><button type="button" class="parity-dialog-close" aria-label="Close" @click="open = false"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12M6 6l12 12" /></svg></button>
          <div class="parity-dialog-header"><Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>Dialog Description</Dialog.Description></div>
          <div class="parity-dialog-footer"><Dialog.CloseTrigger class="parity-button">Cancel</Dialog.CloseTrigger></div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>
