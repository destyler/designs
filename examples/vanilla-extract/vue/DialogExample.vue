<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Dialog } from '@destyler-ui/vue'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'

const props = defineProps<{ colorMode: 'light' | 'dark' }>()
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const theme = computed(() => themes[props.colorMode])
</script>

<template>
  <Dialog.Root>
    <Dialog.Trigger :class="c.button">Open dialog</Dialog.Trigger>
    <Teleport v-if="mounted" to="body">
      <div :class="['showcase-portal', theme]" data-portal-owner="vue" :data-theme="colorMode">
        <Dialog.Backdrop :class="c.dialogBackdrop"/>
        <Dialog.Positioner :class="c.dialogPositioner">
          <Dialog.Content :class="c.dialogContent" data-demo-dialog="vue">
            <div :class="c.dialogHeader">
              <Dialog.Title :class="c.dialogTitle">Dialog title</Dialog.Title>
              <Dialog.Description :class="c.dialogDescription">This is a dialog description.</Dialog.Description>
            </div>
            <div :class="c.dialogFooter"><Dialog.CloseTrigger :class="c.button">Close</Dialog.CloseTrigger></div>
          </Dialog.Content>
        </Dialog.Positioner>
      </div>
    </Teleport>
  </Dialog.Root>
</template>
