<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Dialog } from '@destyler-ui/vue'

const mounted = ref(false)
onMounted(() => { mounted.value = true })
</script>

<template>
  <Dialog.Root>
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    <Teleport v-if="mounted" to="body">
      <div data-portal-owner="vue">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-demo-dialog="vue">
            <Dialog.Title>Dialog title</Dialog.Title>
            <Dialog.Description>This is a dialog description.</Dialog.Description>
            <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </div>
    </Teleport>
  </Dialog.Root>
</template>
