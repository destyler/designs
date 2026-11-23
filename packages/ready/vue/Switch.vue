<script setup lang="ts">
import { computed, useId, ref, watchPostEffect } from 'vue'
import { Switch as Primitive, useFieldContext } from '@destyler-ui/vue'
import { validateAccessibleText } from '../accessible-text'
import { describeField } from '../switch-description'
import type { SwitchProps } from '../types'

const props = withDefaults(defineProps<Omit<SwitchProps, 'onCheckedChange'>>(), {
  checked: undefined, defaultChecked: undefined, disabled: undefined, required: undefined,
})
const emit = defineEmits<{ 'update:checked': [value: boolean]; checkedChange: [value: boolean] }>()
const field = useFieldContext()
const id = useId()
const element = ref<HTMLDivElement>()
const text = computed(() => describeField(id, props.description, props.error, field?.value?.ariaDescribedby))
watchPostEffect(() => { element.value?.querySelector('input')?.setCustomValidity(props.error ?? '') })
function change({ checked }: { checked: boolean }) {
  emit('update:checked', checked)
  emit('checkedChange', checked)
}
</script>

<template>
  <div ref="element" class="rd-component">
    <Primitive.Root :checked="checked" :default-checked="defaultChecked" :disabled="disabled" :required="required" :name="name" :value="value"
      :invalid="Boolean(error) || field?.invalid" @checked-change="change">
      <Primitive.Control><Primitive.Thumb /></Primitive.Control>
      <Primitive.Label>{{ validateAccessibleText(label, 'Switch', 'label') }}</Primitive.Label>
      <Primitive.HiddenInput role="switch" :aria-describedby="text.describedBy" />
    </Primitive.Root>
    <p v-if="text.hasDescription" :id="text.descriptionId" class="rd-description">{{ description }}</p>
    <p v-if="error" :id="text.errorId" class="rd-error">{{ error }}</p>
  </div>
</template>
