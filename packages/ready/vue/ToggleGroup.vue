<script setup lang="ts">
import { computed } from 'vue'
import { ToggleGroup as Primitive } from '@destyler-ui/vue'
import { toggleGroupModel, type ToggleGroupProps } from '../ToggleGroup'

const props = withDefaults(defineProps<Omit<ToggleGroupProps, 'onValueChange'>>(), {
  disabled: undefined, loopFocus: undefined,
})
const emit = defineEmits<{ 'update:value': [value: string[]]; valueChange: [value: string[]] }>()
const model = computed(() => toggleGroupModel(props))
function change({ value }: { value: string[] }) {
  emit('update:value', value)
  emit('valueChange', value)
}
</script>

<template>
  <div class="rd-component rd-toggle-group">
    <Primitive.Root :aria-label="model.label" :aria-disabled="model.disabled || undefined"
      v-bind="model.disabled ? { tabindex: -1 } : {}"
      multiple roving-focus :model-value="model.value" :default-value="model.defaultValue"
      :disabled="model.disabled" :orientation="orientation" :loop-focus="loopFocus" @value-change="change">
      <Primitive.Item v-for="item in items" :key="item.value" :value="item.value" :disabled="item.disabled">
        {{ item.label }}
      </Primitive.Item>
    </Primitive.Root>
  </div>
</template>
