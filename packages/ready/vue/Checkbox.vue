<script setup lang="ts">
import { ref, computed, useId, watchPostEffect } from 'vue'
import { Checkbox, useFieldContext } from '@destyler-ui/vue'
const props = withDefaults(defineProps<{ label: string; checked?: boolean; name?: string; disabled?: boolean; required?: boolean; error?: string }>(), { checked: undefined, required: undefined, disabled: undefined })
const emit = defineEmits<{ 'update:checked': [value: boolean]; checkedChange: [value: boolean] }>()
const local = ref(false)
const element=ref<HTMLDivElement>(), errorId=useId(), field=useFieldContext()
const describedBy=computed(()=>[field?.value?.ariaDescribedby,props.error ? errorId : undefined].filter(Boolean).join(' ') || undefined)
watchPostEffect(()=>{const error=props.error ?? '';element.value?.querySelector('input')?.setCustomValidity(error)})
const current = computed({ get: () => props.checked ?? local.value, set: value => { local.value = value; emit('update:checked', value); emit('checkedChange', value) } })
</script>
<template>
  <div ref="element" class="rd-component"><Checkbox.Root :required="required" :invalid="error ? true : undefined" :checked="current" :name="name" :disabled="disabled" @checked-change="current = $event.checked === true">
    <Checkbox.Control><Checkbox.Indicator><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6" /></svg></Checkbox.Indicator></Checkbox.Control>
    <Checkbox.Label>{{ label }}</Checkbox.Label><Checkbox.HiddenInput :aria-describedby="describedBy" />
  </Checkbox.Root><p v-if="error" :id="errorId" class="rd-error">{{ error }}</p></div>
</template>
