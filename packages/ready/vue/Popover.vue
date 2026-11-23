<script setup lang="ts">
import { computed, useId } from 'vue'
import { Popover as Primitive } from '@destyler-ui/vue'
import { popoverPositioning, popoverText } from '../Popover'
import type { PopoverProps } from '../Popover'

const props = withDefaults(defineProps<Omit<PopoverProps, 'onOpenChange'>>(), { open: undefined, defaultOpen: undefined })
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>()
const text = computed(() => popoverText(props.trigger, props.title, props.closeLabel, props.description))
const id = useId()
const ids = { title: `${id}-title`, description: `${id}-description` }
function change({ open }: { open: boolean }) {
  emit('update:open', open)
  emit('openChange', open)
}
</script>

<template>
  <div class="rd-component rd-popover">
    <Primitive.Root :open="open" :default-open="defaultOpen" :modal="false" :portalled="false"
      :positioning="popoverPositioning" :ids="ids" @open-change="change">
      <Primitive.Trigger class="rd-button">{{ text.trigger }}</Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content :aria-labelledby="ids.title" :aria-describedby="text.description ? ids.description : undefined">
          <Primitive.Title>{{ text.title }}</Primitive.Title>
          <Primitive.Description v-if="text.description">{{ text.description }}</Primitive.Description>
          <div class="rd-popover-body"><slot /></div>
          <Primitive.CloseTrigger class="rd-button" :aria-label="text.closeLabel">{{ text.closeLabel }}</Primitive.CloseTrigger>
        </Primitive.Content>
      </Primitive.Positioner>
    </Primitive.Root>
  </div>
</template>
