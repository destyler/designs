<script setup lang="ts">
import { ref, computed, nextTick, watchPostEffect, useId } from 'vue'
import { Select, createListCollection, useFieldContext } from '@destyler-ui/vue'
import HiddenSelect from './HiddenSelect.vue'
import type { Option } from '../types'
import { validateSelectOptions } from '../select-options'
const props = withDefaults(defineProps<{ label: string; options: Option[]; value?: string; name?: string; placeholder?: string; disabled?: boolean; required?: boolean; error?: string }>(), { required: undefined, disabled: undefined })
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
const local = ref('')
const element = ref<HTMLDivElement>()
const errorId=useId(), field=useFieldContext()
const describedBy=computed(()=>[field?.value?.ariaDescribedby,props.error ? errorId : undefined].filter(Boolean).join(' ') || undefined)
watchPostEffect(()=>{const error=props.error ?? '';element.value?.querySelector('select')?.setCustomValidity(error)})
const requested = computed(() => props.value ?? local.value)
// Keep a missing requested key pending without letting native SSR select the first option.
const current = computed(() => props.options.some(item => item.value === requested.value) ? requested.value : '')
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
  <div ref="element" class="rd-component"><Select.Root :required="required" :invalid="error ? true : (field?.invalid ?? false)" :collection="collection" :model-value="current ? [current] : []" :name="name" :disabled="disabled" @value-change="change($event.value)">
    <Select.Label>{{ label }}</Select.Label><Select.Control><Select.Trigger :aria-describedby="describedBy" :aria-required="required ?? field?.required"><Select.ValueText :placeholder="placeholder ?? 'Choose an option'" /><Select.Indicator aria-hidden="true">⌄</Select.Indicator></Select.Trigger></Select.Control>
    <Select.Positioner><Select.Content><Select.Item v-for="item in options" :key="item.value" :item="item"><Select.ItemText>{{ item.label }}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator></Select.Item></Select.Content></Select.Positioner><HiddenSelect :described-by="describedBy" />
  </Select.Root><p v-if="error" :id="errorId" class="rd-error">{{ error }}</p></div>
</template>
