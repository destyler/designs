<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { ColorPicker as Primitive, parseColor } from '@destyler-ui/vue'
import { colorPickerModel, commitColorInput, handleColorInputKey, initialColor, type ColorPickerProps } from '../ColorPicker'

defineOptions({ inheritAttrs: false })
const props = defineProps<Omit<ColorPickerProps, 'onValueChange'>>()
const emit = defineEmits<{ 'update:value': [hex: string]; valueChange: [hex: string] }>()
const local = ref(initialColor(props.defaultValue))
const model = computed(() => colorPickerModel(props, local.value))
const selected = computed(() => parseColor(model.value.color))
const id = useId()

function change(next: string) {
  if (props.disabled || next === model.value.color) return
  if (props.value === undefined) local.value = next
  emit('update:value', next)
  emit('valueChange', next)
}
function onBlur(event: FocusEvent) {
  commitColorInput(event.currentTarget as HTMLInputElement, model.value.color, change)
}
function onKeyDown(event: KeyboardEvent) {
  handleColorInputKey(event, event.currentTarget as HTMLInputElement, model.value.color, change)
}
</script>

<template>
  <Primitive.Root class="rd-component rd-color-picker" :model-value="selected" :disabled="props.disabled"
    @value-change="({ value }) => change(value.toString('hex'))">
    <label :for="id">{{ model.label }}</label>
    <Primitive.Control>
      <input :id="id" class="rd-color-hex" type="text" :value="model.color" :disabled="props.disabled"
        autocomplete="off" :spellcheck="false" @blur="onBlur" @keydown="onKeyDown" />
      <Primitive.ValueSwatch aria-hidden="true" />
    </Primitive.Control>
    <Primitive.SwatchGroup v-if="model.presets.length" aria-label="Preset colors">
      <Primitive.SwatchTrigger v-for="preset in model.presets" :key="preset" :value="preset"
        :aria-label="`Select ${preset}`" :aria-pressed="preset === model.color" />
    </Primitive.SwatchGroup>
  </Primitive.Root>
</template>
