<script setup lang="ts">
import { ref, computed } from 'vue'
import { Checkbox } from '@destyler-ui/vue'
const props = withDefaults(defineProps<{ label: string; checked?: boolean; name?: string; disabled?: boolean }>(), { checked: undefined })
const emit = defineEmits<{ 'update:checked': [value: boolean]; checkedChange: [value: boolean] }>()
const local = ref(false)
const current = computed({ get: () => props.checked ?? local.value, set: value => { local.value = value; emit('update:checked', value); emit('checkedChange', value) } })
</script>
<template>
  <div class="rd-component"><Checkbox.Root :checked="current" :name="name" :disabled="disabled" @checked-change="current = $event.checked === true">
    <Checkbox.Control><Checkbox.Indicator><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6" /></svg></Checkbox.Indicator></Checkbox.Control>
    <Checkbox.Label>{{ label }}</Checkbox.Label><Checkbox.HiddenInput />
  </Checkbox.Root></div>
</template>
