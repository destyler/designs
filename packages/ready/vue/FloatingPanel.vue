<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { FloatingPanel as Primitive } from '@destyler-ui/vue'
import { connectFloatingPanelFocus, floatingPanelGeometry, floatingPanelText, type FloatingPanelProps } from '../FloatingPanel'

const props = withDefaults(defineProps<Omit<FloatingPanelProps, 'onOpenChange'>>(), { open: undefined, defaultOpen: undefined })
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>()
const text = computed(() => floatingPanelText(props.trigger, props.title, props.moveHint, props.closeLabel))
const id = useId()
const ids = { title: `${id}-title` }
const hintId = `${id}-movement`
const localOpen = ref(props.defaultOpen ?? false)
const expanded = computed(() => props.open ?? localOpen.value)
const root = ref<HTMLElement>()
let disconnect: (() => void) | undefined
onMounted(() => { if (root.value) disconnect = connectFloatingPanelFocus(root.value) })
onBeforeUnmount(() => disconnect?.())
function change({ open: next }: { open: boolean }) {
  if (props.open === undefined) localOpen.value = next
  emit('update:open', next)
  emit('openChange', next)
}
</script>

<template>
  <div ref="root" class="rd-component rd-floating-panel">
    <Primitive.Root v-bind="floatingPanelGeometry" :ids="ids" :open="expanded" :close-on-escape="true"
      :allow-overflow="false" :resizable="false" @open-change="change">
      <Primitive.Trigger class="rd-button" aria-haspopup="dialog" :aria-expanded="expanded">{{ text.trigger }}</Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content :aria-describedby="hintId">
          <Primitive.Header>
            <Primitive.DragTrigger><Primitive.Title>{{ text.title }}</Primitive.Title></Primitive.DragTrigger>
            <Primitive.CloseTrigger class="rd-button">{{ text.closeLabel }}</Primitive.CloseTrigger>
          </Primitive.Header>
          <p :id="hintId" class="rd-floating-panel-hint">{{ text.moveHint }}</p>
          <Primitive.Body><slot /></Primitive.Body>
        </Primitive.Content>
      </Primitive.Positioner>
    </Primitive.Root>
  </div>
</template>
