<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog } from '@destyler-ui/vue'
const props = withDefaults(defineProps<{ trigger: string; title: string; description?: string; open?: boolean }>(), { open: undefined })
const emit = defineEmits<{ 'update:open': [value: boolean]; openChange: [value: boolean] }>()
const local = ref(false)
const current = computed(() => props.open ?? local.value)
function change(value: boolean) { local.value = value; emit('update:open', value); emit('openChange', value) }
</script>
<template>
  <div class="rd-component"><Dialog.Root :open="current" @open-change="change($event.open)">
    <Dialog.Trigger class="rd-button">{{ trigger }}</Dialog.Trigger><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content>
      <Dialog.Title>{{ title }}</Dialog.Title><Dialog.Description v-if="description">{{ description }}</Dialog.Description><div class="rd-dialog-body"><slot /></div><Dialog.CloseTrigger class="rd-button">Close</Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner>
  </Dialog.Root></div>
</template>
