<script setup lang="ts">
import { computed, ref, useId, watchPostEffect } from 'vue'
import { NumberInput as Primitive, useFieldContext } from '@destyler-ui/vue'
import { numberInputOptions, type NumberInputProps } from '../NumberInput'
import { describeField } from '../switch-description'

const props = withDefaults(defineProps<Omit<NumberInputProps, 'onValueChange'>>(), {
  disabled: undefined, required: undefined, readOnly: undefined,
})
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
const field = useFieldContext()
const id = useId()
const root = ref<HTMLDivElement>()
const options = computed(() => numberInputOptions(props))
const text = computed(() => describeField(id, props.description, props.error, field?.value?.ariaDescribedby))
watchPostEffect(() => { root.value?.querySelector('input')?.setCustomValidity(props.error ?? '') })
function change({ value }: { value: string }) {
  emit('update:value', value)
  emit('valueChange', value)
}
</script>

<template>
  <div ref="root" class="rd-component">
    <Primitive.Root v-bind="options" :name="name" :form="form" :model-value="value" :default-value="defaultValue"
      :disabled="disabled" :required="required" :read-only="readOnly"
      :invalid="Boolean(error) || field?.invalid" @value-change="change">
      <Primitive.Label>{{ label }}</Primitive.Label>
      <Primitive.Control>
        <Primitive.DecrementTrigger><span aria-hidden="true">−</span></Primitive.DecrementTrigger>
        <Primitive.Input :aria-describedby="text.describedBy" />
        <Primitive.IncrementTrigger><span aria-hidden="true">+</span></Primitive.IncrementTrigger>
      </Primitive.Control>
    </Primitive.Root>
    <p v-if="text.hasDescription" :id="text.descriptionId" class="rd-description">{{ description }}</p>
    <p v-if="error" :id="text.errorId" class="rd-error">{{ error }}</p>
  </div>
</template>
