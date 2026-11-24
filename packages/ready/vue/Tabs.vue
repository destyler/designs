<script setup lang="ts">
import { computed } from 'vue'
import { Tabs as Primitive } from '@destyler-ui/vue'
import { validateTabs } from '../Tabs.model'
import type { TabsItem, TabsProps } from '../Tabs.types'

const props = defineProps<Omit<TabsProps, 'onValueChange'>>()
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
defineSlots<{ panel?: (props: { item: TabsItem }) => unknown }>()
const initial = computed(() => validateTabs(props.label, props.items, props.value, props.defaultValue))
function change({ value }: { value: string | null }) {
  if (value === null) return
  emit('update:value', value)
  emit('valueChange', value)
}
</script>

<template>
  <div class="rd-component">
    <Primitive.Root :model-value="value" :default-value="initial"
      :orientation="orientation ?? 'horizontal'" :activation-mode="activationMode ?? 'automatic'"
      loop-focus composite @value-change="change">
      <Primitive.List :aria-label="label">
        <Primitive.Trigger v-for="item in items" :key="item.value"
          :value="item.value" :disabled="item.disabled">{{ item.label }}</Primitive.Trigger>
      </Primitive.List>
      <Primitive.Content v-for="item in items" :key="item.value" :value="item.value">
        <slot name="panel" :item="item">{{ item.content }}</slot>
      </Primitive.Content>
    </Primitive.Root>
  </div>
</template>
