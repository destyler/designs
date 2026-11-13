<script setup lang="ts">
import { validateAccessibleText } from '../accessible-text'
import { ref, computed, useId } from 'vue'
import { Dialog } from '@destyler-ui/vue'
const props = withDefaults(defineProps<{ trigger: string; title: string; description?: string; open?: boolean }>(), { open: undefined })
const emit = defineEmits<{ 'update:open': [value: boolean]; openChange: [value: boolean] }>()
const local = ref(false)
// Own the optional description link; primitive presence detection runs only on open.
const descriptionId = useId()
const current = computed(() => props.open ?? local.value)
function change(value: boolean) { local.value = value; emit('update:open', value); emit('openChange', value) }
function validateText() { validateAccessibleText(props.trigger, 'Dialog', 'trigger'); validateAccessibleText(props.title, 'Dialog', 'title'); return 'rd-component' }
</script>
<template>
  <div :class="validateText()"><Dialog.Root :open="current" @open-change="change($event.open)">
    <Dialog.Trigger class="rd-button">{{ trigger }}</Dialog.Trigger><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content :aria-describedby="description ? descriptionId : undefined">
      <Dialog.Title>{{ title }}</Dialog.Title><Dialog.Description v-if="description" :id="descriptionId">{{ description }}</Dialog.Description><div class="rd-dialog-body"><slot /></div><Dialog.CloseTrigger class="rd-button">Close</Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner>
  </Dialog.Root></div>
</template>
