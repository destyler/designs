<script setup lang="ts">
import { computed, useId } from 'vue'
import { Radio as Primitive } from '@destyler-ui/vue'
import { radioItemIds, validateRadioGroup, type RadioGroupProps } from '../RadioGroup'

const props = withDefaults(defineProps<Omit<RadioGroupProps, 'onValueChange'>>(), {
  disabled: undefined, required: undefined,
})
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
const ids = radioItemIds(useId())
const options = computed(() => validateRadioGroup(props.label, props.items))
// The Vue primitive types modelValue as string; the reserved empty value keeps
// a null selection controlled without ever matching an item.
const modelValue = computed(() => props.value === null ? '' : props.value)
function change({ value }: { value: string }) {
  if (value === '') return
  emit('update:value', value)
  emit('valueChange', value)
}
</script>

<template>
  <Primitive.Root class="rd-component rd-radio-group" :ids="ids" :model-value="modelValue" :default-value="defaultValue ?? undefined"
    :disabled="disabled" :name="name" :orientation="orientation" :aria-required="required || undefined"
    :aria-disabled="disabled || undefined" @value-change="change">
    <Primitive.Label>{{ label }}</Primitive.Label>
    <div class="rd-radio-group-items">
      <Primitive.Item v-for="item in options" :key="item.value" :value="item.value" :disabled="item.disabled">
        <Primitive.ItemControl />
        <Primitive.ItemText>{{ item.label }}</Primitive.ItemText>
        <Primitive.ItemHiddenInput :required="required" />
      </Primitive.Item>
    </div>
  </Primitive.Root>
</template>
