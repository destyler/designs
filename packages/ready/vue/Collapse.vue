<script setup lang="ts">
import { computed } from 'vue'
import { Collapse as Primitive } from '@destyler-ui/vue'
import { collapseItems, collapseValue } from '../Collapse'
import type { CollapseItem, CollapseProps } from '../Collapse'

const props = defineProps<Omit<CollapseProps, 'onValueChange'>>()
const emit = defineEmits<{ 'update:value': [value: string[]]; valueChange: [value: string[]] }>()
defineSlots<{ panel?: (props: { item: CollapseItem }) => unknown }>()
const known = computed(() => collapseItems(props.items))
function change({ value }: { value: string[] }) {
  emit('update:value', [...value])
  emit('valueChange', [...value])
}
</script>

<template>
  <div class="rd-component">
    <Primitive.Root :model-value="collapseValue(known, multiple, value)"
      :default-value="value === undefined ? collapseValue(known, multiple, defaultValue) : undefined"
      :multiple="multiple" :collapsible="collapsible" :disabled="disabled" :orientation="orientation ?? 'vertical'"
      @value-change="change">
      <Primitive.Item v-for="item in items" :key="item.value" :value="item.value" :disabled="Boolean(disabled || item.disabled)">
        <div class="rd-collapse-heading" role="heading" :aria-level="headingLevel ?? 3">
          <Primitive.ItemTrigger>
            <span>{{ item.label }}</span>
            <Primitive.ItemIndicator>⌄</Primitive.ItemIndicator>
          </Primitive.ItemTrigger>
        </div>
        <Primitive.ItemContent><slot name="panel" :item="item">{{ item.content }}</slot></Primitive.ItemContent>
      </Primitive.Item>
    </Primitive.Root>
  </div>
</template>
