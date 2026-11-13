<script setup lang="ts">
import { ref, computed, nextTick, watchPostEffect } from 'vue'
import { Select, createListCollection } from '@destyler-ui/vue'
import HiddenSelect from './HiddenSelect.vue'
import type { Option } from '../types'
import { validateSelectOptions } from '../select-options'
const props = defineProps<{ label: string; options: Option[]; value?: string; name?: string; placeholder?: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
const local = ref('')
const element = ref<HTMLDivElement>()
const current = computed(() => props.value ?? local.value)
const collection = computed(() => createListCollection({ items: validateSelectOptions(props.options) }))
function syncHidden() {
  const value = current.value
  const select = element.value?.querySelector('select')
  if (!select?.isConnected) return
  for (const option of select.options) option.toggleAttribute('selected', option.value === value)
  select.value = value
}
watchPostEffect((cleanup) => { current.value; props.options.map(item => item.value); const timer = setTimeout(syncHidden, 0); cleanup(() => clearTimeout(timer)) })
function change(values: string[]) {
  const value = values[0] ?? ''; local.value = value; emit('update:value', value); emit('valueChange', value)
  // Read the latest parent value after callbacks, including ignored controlled resets.
  void nextTick(() => setTimeout(syncHidden, 0))
}
</script>
<template>
  <div ref="element" class="rd-component"><Select.Root :collection="collection" :model-value="current ? [current] : []" :name="name" :disabled="disabled" @value-change="change($event.value)">
    <Select.Label>{{ label }}</Select.Label><Select.Control><Select.Trigger><Select.ValueText :placeholder="placeholder ?? 'Choose an option'" /><Select.Indicator aria-hidden="true">⌄</Select.Indicator></Select.Trigger></Select.Control>
    <Select.Positioner><Select.Content><Select.Item v-for="item in options" :key="item.value" :item="item"><Select.ItemText>{{ item.label }}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator></Select.Item></Select.Content></Select.Positioner><HiddenSelect />
  </Select.Root></div>
</template>
