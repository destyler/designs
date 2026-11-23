<script setup lang="ts">
import { computed, nextTick, useId } from 'vue'
import { Field as UI } from '@destyler-ui/vue'
import { fieldText, type FieldProps } from '../Field'

const props = withDefaults(defineProps<Omit<FieldProps, 'onValueChange'>>(), {
  disabled: undefined, required: undefined, readOnly: undefined,
})
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
const id = useId()
const initial = props.defaultValue
const text = computed(() => fieldText(id, props.label, props.description, props.error))

async function onInput(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  emit('update:value', input.value)
  emit('valueChange', input.value)
  await nextTick()
  if (input.isConnected && props.value !== undefined) input.value = props.value
}
</script>

<template>
  <UI.Root class="rd-component rd-field" :ids="text.ids" :disabled="disabled" :required="required"
    :read-only="readOnly" :invalid="Boolean(text.error)">
    <UI.Label>{{ text.label }}</UI.Label>
    <UI.Input :model-value="value ?? initial" :name="name" :type="type" :placeholder="placeholder" :autocomplete="autoComplete"
      :aria-describedby="text.describedBy" @input="onInput" />
    <UI.HelperText v-if="text.description" class="rd-description">{{ text.description }}</UI.HelperText>
    <UI.ErrorText v-if="text.error" class="rd-error">{{ text.error }}</UI.ErrorText>
  </UI.Root>
</template>
